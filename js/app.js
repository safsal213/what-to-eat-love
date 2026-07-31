import { fetchAppData, fetchLatestSelection, saveSelection, toggleFavorite } from './api.js';
import { normalizeAppData } from './data.js';
import {
  saveCachedData,
  getCachedData,
  saveLatestSelection,
  getLatestSelection,
  saveUserRole,
  getUserRole,
  clearUserRole
} from './storage.js';
import { el, showView, createCard, createCategoryCard, setImageWithFallback, renderMeta, showError } from './ui.js';
import { shuffleArray } from './utils.js';
import { createSwipeController } from './swipe.js';

const state = {
  categories: [],
  meals: [],
  settings: {},
  favorites: [],
  selectedCategory: null,
  selectedMeal: null,
  role: getUserRole(),
  latestSelectionTimer: null,
  swipeMeals: [],
  swipeIndex: 0,
  swipeBusy: false
};

const swipeController = createSwipeController({
  getMeals: () => state.swipeMeals,
  getIndex: () => state.swipeIndex,
  setIndex: value => {
    state.swipeIndex = value;
  },
  getBusy: () => state.swipeBusy,
  setBusy: value => {
    state.swipeBusy = value;
  },
  onChoose: meal => openMeal(meal),
  onToggleFavorite: meal => handleToggleFavorite(meal)
});

async function startApp() {
  stopLatestSelectionPolling();
  if (!state.role) {
    updateHeaderForRole(null);
    showView('roleView');
    return;
  }

  showView('loadingView');
  try {
    const rawData = await fetchAppData();
    applyData(normalizeAppData(rawData));
    saveCachedData(rawData);
  } catch (error) {
    console.error(error);
    const cached = getCachedData();
    if (cached) applyData(normalizeAppData(cached));
    else showError('לא הצלחנו להתחבר ל־Google Sheets. בדוק את החיבור ונסה שוב.');
  }
}

function applyData(data) {
  state.categories = data.categories;
  state.meals = data.meals;
  state.settings = data.settings;
  state.favorites = data.favorites || [];
  document.title = state.settings.AppName || 'מה בא לך לאכול אהובתי?';
  openRoleHome();
}

function chooseRole(role) {
  state.role = role;
  saveUserRole(role);
  startApp();
}

function openRoleHome() {
  updateHeaderForRole(state.role);
  el('switchRoleBtn').classList.remove('hidden');

  if (state.role === 'haim') {
    showView('haimView');
    refreshLatestSelection();
    startLatestSelectionPolling();
    return;
  }

  renderCategories();
  showView('categoriesView');
}

function updateHeaderForRole(role) {
  const eyebrow = el('headerEyebrow');
  const title = el('appTitle');
  const greeting = el('headerGreeting');
  const avatar = el('headerAvatar');
  el('switchRoleBtn').classList.toggle('hidden', !role);

  if (role === 'haim') {
    eyebrow.textContent = 'שלום חיים';
    title.textContent = 'הבחירה של מעיין';
    greeting.textContent = 'כאן תראה מיד מה בא לה לאכול';
    avatar.textContent = '👨';
  } else if (role === 'maayan') {
    eyebrow.textContent = 'היי מעיין 🌸';
    title.textContent = state.settings.AppName || 'מה בא לך לאכול היום?';
    greeting.textContent = 'בחרי את מה שהכי עושה לך חשק';
    avatar.textContent = '👩';
  } else {
    eyebrow.textContent = 'האפליקציה של חיים ומעיין';
    title.textContent = 'מה בא לך?';
    greeting.textContent = 'בוחרים משהו טעים ביחד';
    avatar.textContent = '❤️';
  }
}

function renderCategories() {
  const grid = el('categoriesGrid');
  grid.innerHTML = '';

  state.categories.forEach((category, index) => {
    const mealCount = category.key === 'surprise'
      ? state.meals.length
      : state.meals.filter(meal => meal.category === category.key).length;

    const card = createCategoryCard(category, mealCount, () => {
      if (category.key === 'surprise') return openRandomMeal(state.meals);
      state.selectedCategory = category;
      renderMeals(category);
    });

    card.style.setProperty('--card-index', index);
    grid.appendChild(card);
  });
}

function renderMeals(category) {
  el('mealsTitle').textContent = category.name;

  const list = shuffleArray(
    state.meals.filter(meal => meal.category === category.key)
  );

  state.swipeMeals = list;
  state.swipeIndex = 0;
  state.swipeBusy = false;

  el('emptyMeals').classList.toggle('hidden', list.length > 0);
  el('swipeActions').classList.toggle('hidden', list.length === 0);
  el('shuffleDeckBtn').classList.toggle('hidden', list.length === 0);

  swipeController.render();
  showView('mealsView');
}

async function handleToggleFavorite(meal) {
  if (!meal || state.role !== 'maayan') return;

  const previousValue = meal.favorite;
  meal.favorite = !meal.favorite;
  swipeController.render();

  try {
    const result = await toggleFavorite(meal, 'מעיין');
    meal.favorite = Boolean(result?.Active);
    swipeController.render();
  } catch (error) {
    console.error(error);
    meal.favorite = previousValue;
    swipeController.render();
    alert('לא הצלחנו לעדכן את המועדפים');
  }
}

function openRandomMeal(meals) {
  if (meals.length) openMeal(meals[Math.floor(Math.random() * meals.length)]);
}

function openMeal(meal) {
  state.selectedMeal = meal;
  el('choiceName').textContent = meal.name;
  el('choiceDescription').textContent = meal.description || 'נשמע טעים 😋';
  el('choiceEmoji').textContent = meal.emoji || '🍽️';
  setImageWithFallback(el('choiceImage'), meal.image, el('choiceEmoji'));
  renderMeta(meal);
  showView('choiceView');
}

async function confirmSelection() {
  const meal = state.selectedMeal;
  if (!meal) return;
  const button = el('confirmBtn');
  const oldText = button.textContent;
  button.disabled = true;
  button.textContent = 'שומר…';

  try {
    const result = await saveSelection(meal);
    saveLatestSelection(result.selection || { ...meal, selectedAt: new Date().toISOString(), selectedBy: 'מעיין' });
    el('successText').textContent = `מעולה ❤️ בחרת ${meal.name}`;
    showView('successView');
  } catch (error) {
    console.error(error);
    alert('לא הצלחנו לשמור את הבחירה');
  } finally {
    button.disabled = false;
    button.textContent = oldText;
  }
}

async function refreshLatestSelection() {
  const button = el('refreshSelectionBtn');
  const oldText = button.textContent;
  button.disabled = true;
  button.textContent = 'מרענן…';

  try {
    const selection = await fetchLatestSelection();
    if (selection) {
      saveLatestSelection(selection);
      renderLatestSelection(selection);
    } else {
      renderNoSelection();
    }
  } catch (error) {
    console.error(error);
    const cached = getLatestSelection();
    if (cached) renderLatestSelection(cached);
    else renderNoSelection();
  } finally {
    button.disabled = false;
    button.textContent = oldText;
  }
}

function renderLatestSelection(selection) {
  const mealId = selection.MealID || selection.mealId || selection.id || '';
  const mealName = selection.MealName || selection.mealName || selection.name || 'מנה שנבחרה';
  const dateValue = selection.Date || selection.SelectedAt || selection.selectedAt || '';
  const notes = selection.Notes || selection.notes || '';
  const status = selection.Status || selection.status || 'חדש';
  const meal = state.meals.find(item => item.id === mealId || item.name === mealName);

  el('noSelectionCard').classList.add('hidden');
  el('latestSelectionCard').classList.remove('hidden');
  el('latestSelectionName').textContent = mealName;
  el('latestSelectionTime').textContent = formatRelativeTime(dateValue);
  el('latestSelectionStatus').textContent = status;
  el('latestSelectionNotes').textContent = notes ? `הערה: ${notes}` : '';
  el('latestSelectionNotes').classList.toggle('hidden', !notes);
  el('latestSelectionEmoji').textContent = meal?.emoji || '🍽️';
  setImageWithFallback(el('latestSelectionImage'), meal?.image || '', el('latestSelectionEmoji'));
}

function renderNoSelection() {
  el('latestSelectionCard').classList.add('hidden');
  el('noSelectionCard').classList.remove('hidden');
}

function formatRelativeTime(value) {
  if (!value) return 'נבחרה לאחרונה';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return `נבחרה בתאריך ${value}`;
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return 'נבחרה עכשיו';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `נבחרה לפני ${minutes} דקות`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `נבחרה לפני ${hours} שעות`;
  return `נבחרה ב־${date.toLocaleDateString('he-IL')} בשעה ${date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}`;
}

function startLatestSelectionPolling() {
  stopLatestSelectionPolling();
  state.latestSelectionTimer = window.setInterval(refreshLatestSelection, 20000);
}

function stopLatestSelectionPolling() {
  if (state.latestSelectionTimer) window.clearInterval(state.latestSelectionTimer);
  state.latestSelectionTimer = null;
}

function switchRole() {
  stopLatestSelectionPolling();
  clearUserRole();
  state.role = null;
  state.selectedCategory = null;
  state.selectedMeal = null;
  updateHeaderForRole(null);
  showView('roleView');
}

el('chooseMaayanBtn').addEventListener('click', () => chooseRole('maayan'));
el('chooseHaimBtn').addEventListener('click', () => chooseRole('haim'));
el('switchRoleBtn').addEventListener('click', switchRole);
el('refreshSelectionBtn').addEventListener('click', refreshLatestSelection);
el('confirmBtn').addEventListener('click', confirmSelection);
el('homeBtn').addEventListener('click', () => showView('categoriesView'));
el('retryBtn').addEventListener('click', startApp);

el('skipMealBtn').addEventListener('click', () => {
  const meal = state.swipeMeals[state.swipeIndex];
  swipeController.swipe('left', meal);
});

el('chooseMealBtn').addEventListener('click', () => {
  const meal = state.swipeMeals[state.swipeIndex];
  swipeController.swipe('right', meal);
});

el('shuffleDeckBtn').addEventListener('click', () => {
  state.swipeMeals = shuffleArray(state.swipeMeals);
  state.swipeIndex = 0;
  state.swipeBusy = false;
  swipeController.render();
});

el('backBtn').addEventListener('click', () => {
  const choiceViewOpen = !el('choiceView').classList.contains('hidden');
  const mealsViewOpen = !el('mealsView').classList.contains('hidden');

  if (choiceViewOpen && state.selectedCategory) {
    state.swipeBusy = false;
    state.selectedMeal = null;
    swipeController.render();
    showView('mealsView');
    return;
  }

  if (mealsViewOpen) {
    state.selectedCategory = null;
    state.swipeMeals = [];
    state.swipeIndex = 0;
    state.swipeBusy = false;
    showView('categoriesView');
    return;
  }

  showView('categoriesView');
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js'));
}

startApp();
