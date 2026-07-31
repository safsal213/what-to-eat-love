import { fetchAppData, fetchLatestSelection, saveSelection } from './api.js';
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

const state = {
  categories: [],
  meals: [],
  settings: {},
  selectedCategory: null,
  selectedMeal: null,
  role: getUserRole(),
  latestSelectionTimer: null
};

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

  renderSwipeDeck();
  showView('mealsView');
}

function shuffleArray(items) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
  }
  return result;
}

function renderSwipeDeck() {
  const deck = el('swipeDeck');
  deck.innerHTML = '';

  const remaining = state.swipeMeals.slice(state.swipeIndex, state.swipeIndex + 3);
  const total = state.swipeMeals.length;
  const current = Math.min(state.swipeIndex + 1, total);

  el('swipeCounter').textContent = total ? `${current} מתוך ${total}` : '0 מתוך 0';

  if (!remaining.length) {
    const finished = document.createElement('div');
    finished.className = 'swipe-finished';
    finished.innerHTML = `
      <div>
        <div class="status-emoji">😅</div>
        <h2>עברנו על כל המנות</h2>
        <p>אפשר לערבב מחדש ולנסות שוב.</p>
      </div>
    `;
    deck.appendChild(finished);
    el('swipeActions').classList.add('hidden');
    return;
  }

  remaining
    .slice()
    .reverse()
    .forEach((meal, reverseIndex) => {
      const actualIndex = state.swipeIndex + (remaining.length - 1 - reverseIndex);
      const card = createSwipeCard(meal, actualIndex === state.swipeIndex);
      deck.appendChild(card);
    });

  el('swipeActions').classList.remove('hidden');
}

function createSwipeCard(meal, isTopCard) {
  const card = document.createElement('article');
  card.className = 'swipe-card';
  card.dataset.mealId = meal.id;

  const metaItems = [];
  if (meal.preparationTime) metaItems.push(`⏱️ ${meal.preparationTime} דקות`);
  if (meal.pregnancySafe) metaItems.push('🤰 מתאים בהיריון');
  if (meal.calories) metaItems.push(`🔥 ${meal.calories} קלוריות`);

  card.innerHTML = `
    <div class="swipe-card-image">
      <span class="swipe-card-emoji">${meal.emoji || '🍽️'}</span>
      ${meal.image ? `<img src="${meal.image}" alt="">` : ''}
      <span class="swipe-card-stamp like">בא לי!</span>
      <span class="swipe-card-stamp nope">לא היום</span>
    </div>
    <div class="swipe-card-body">
      <div class="swipe-card-title-row">
        <h3>${escapeHtml(meal.name)}</h3>
        <span class="swipe-favorite">${meal.favorite ? '❤️' : '🤍'}</span>
      </div>
      <p class="swipe-card-description">${escapeHtml(meal.description || 'נשמע טעים 😋')}</p>
      <div class="swipe-card-meta">
        ${metaItems.map(item => `<span class="meta-pill">${escapeHtml(item)}</span>`).join('')}
      </div>
    </div>
  `;

  const image = card.querySelector('img');
  if (image) {
    image.onerror = () => image.remove();
  }

  if (isTopCard) {
    enableSwipe(card, meal);
  }

  return card;
}

function enableSwipe(card, meal) {
  let startX = 0;
  let currentX = 0;
  let dragging = false;

  const likeStamp = card.querySelector('.like');
  const nopeStamp = card.querySelector('.nope');

  const pointerDown = event => {
    if (state.swipeBusy) return;
    dragging = true;
    startX = event.clientX;
    currentX = 0;
    card.classList.add('is-dragging');
    card.setPointerCapture?.(event.pointerId);
  };

  const pointerMove = event => {
    if (!dragging) return;

    currentX = event.clientX - startX;
    const rotation = Math.max(-13, Math.min(13, currentX / 18));
    card.style.transform = `translateX(${currentX}px) rotate(${rotation}deg)`;

    const strength = Math.min(1, Math.abs(currentX) / 120);
    likeStamp.style.opacity = currentX > 0 ? strength : 0;
    nopeStamp.style.opacity = currentX < 0 ? strength : 0;
  };

  const pointerUp = () => {
    if (!dragging) return;
    dragging = false;
    card.classList.remove('is-dragging');

    if (Math.abs(currentX) >= 95) {
      handleSwipe(currentX > 0 ? 'right' : 'left', meal, card);
      return;
    }

    card.style.transform = '';
    likeStamp.style.opacity = 0;
    nopeStamp.style.opacity = 0;
  };

  card.addEventListener('pointerdown', pointerDown);
  card.addEventListener('pointermove', pointerMove);
  card.addEventListener('pointerup', pointerUp);
  card.addEventListener('pointercancel', pointerUp);
}

function handleSwipe(direction, meal, card = null) {
  if (state.swipeBusy || !meal) return;
  state.swipeBusy = true;

  const activeCard = card || el('swipeDeck').querySelector('.swipe-card:last-child');
  if (!activeCard) {
    state.swipeBusy = false;
    return;
  }

  activeCard.classList.add(
    direction === 'right' ? 'is-exiting-right' : 'is-exiting-left'
  );

  window.setTimeout(() => {
    if (direction === 'right') {
      openMeal(meal);
      state.swipeBusy = false;
      return;
    }

    state.swipeIndex += 1;
    state.swipeBusy = false;
    renderSwipeDeck();
  }, 260);
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
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
  handleSwipe('left', meal);
});

el('chooseMealBtn').addEventListener('click', () => {
  const meal = state.swipeMeals[state.swipeIndex];
  handleSwipe('right', meal);
});

el('shuffleDeckBtn').addEventListener('click', () => {
  state.swipeMeals = shuffleArray(state.swipeMeals);
  state.swipeIndex = 0;
  state.swipeBusy = false;
  renderSwipeDeck();
});

el('backBtn').addEventListener('click', () => {
  if (!el('choiceView').classList.contains('hidden') && state.selectedCategory) return showView('mealsView');
  if (!el('mealsView').classList.contains('hidden')) {
    state.selectedCategory = null;
    return showView('categoriesView');
  }
  showView('categoriesView');
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js'));
}

startApp();
