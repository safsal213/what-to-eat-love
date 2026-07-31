import { fetchAppData, saveSelection } from './api.js';
import { normalizeAppData } from './data.js';
import { saveCachedData, getCachedData, saveLatestSelection } from './storage.js';
import { el, showView, createCard, setImageWithFallback, renderMeta, showError } from './ui.js';

const state = {
  categories: [],
  meals: [],
  settings: {},
  selectedCategory: null,
  selectedMeal: null
};

async function startApp() {
  showView('loadingView');

  try {
    const rawData = await fetchAppData();
    const normalized = normalizeAppData(rawData);
    applyData(normalized);
    saveCachedData(rawData);
  } catch (error) {
    console.error(error);
    const cached = getCachedData();

    if (cached) {
      applyData(normalizeAppData(cached));
    } else {
      showError('לא הצלחנו להתחבר ל־Google Sheets. בדוק את החיבור ונסה שוב.');
    }
  }
}

function applyData(data) {
  state.categories = data.categories;
  state.meals = data.meals;
  state.settings = data.settings;

  if (state.settings.AppName) {
    el('appTitle').textContent = state.settings.AppName;
    document.title = state.settings.AppName;
  }

  renderCategories();
  showView('categoriesView');
}

function renderCategories() {
  const grid = el('categoriesGrid');
  grid.innerHTML = '';

  state.categories.forEach(category => {
    grid.appendChild(
      createCard(category, () => {
        if (category.key === 'surprise') {
          openRandomMeal(state.meals);
          return;
        }

        state.selectedCategory = category;
        renderMeals(category);
      })
    );
  });
}

function renderMeals(category) {
  el('mealsTitle').textContent = category.name;

  const grid = el('mealsGrid');
  grid.innerHTML = '';

  const meals = state.meals.filter(meal => meal.category === category.key);
  el('emptyMeals').classList.toggle('hidden', meals.length > 0);

  meals.forEach(meal => {
    grid.appendChild(createCard(meal, () => openMeal(meal)));
  });

  el('surpriseBtn').onclick = () => openRandomMeal(meals);
  showView('mealsView');
}

function openRandomMeal(meals) {
  if (!meals.length) return;
  openMeal(meals[Math.floor(Math.random() * meals.length)]);
}

function openMeal(meal) {
  state.selectedMeal = meal;

  el('choiceName').textContent = meal.name;
  el('choiceDescription').textContent = meal.description || 'נשמע טעים 😋';
  el('choiceEmoji').textContent = meal.emoji || '🍽️';

  setImageWithFallback(
    el('choiceImage'),
    meal.image,
    el('choiceEmoji')
  );

  renderMeta(meal);
  showView('choiceView');
}

async function confirmSelection() {
  const meal = state.selectedMeal;

  if (!meal) return;

  try {
    await saveSelection(meal);

    el('successText').textContent =
      `מעולה ❤️ בחרת ${meal.name}`;

    showView('successView');
  } catch (error) {
    alert('לא הצלחנו לשמור את הבחירה');
    console.error(error);
  }
}

el('confirmBtn').addEventListener('click', confirmSelection);
el('homeBtn').addEventListener('click', () => showView('categoriesView'));
el('retryBtn').addEventListener('click', startApp);

el('backBtn').addEventListener('click', () => {
  if (state.selectedCategory) {
    renderMeals(state.selectedCategory);
  } else {
    showView('categoriesView');
  }
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js'));
}

startApp();
