import { fetchAppData, fetchLatestSelection, fetchSelectionHistory, saveSelection, toggleFavorite } from './api.js';
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
import { scoreMeals, pickWeightedMeal } from './smartShuffle.js';
import { createSwipeController } from './swipe.js';
import { createRouletteController } from './roulette.js';
import { renderFavoritesScreen } from './favorites.js';
import { renderMealJournal } from './journal.js';
import { calculateInsights, renderInsights } from './insights.js';
import { calculateAchievements, renderAchievements } from './achievements/index.js';
import { buildTimelineEntries, renderTimeline } from './timeline/index.js';
import { calculateJourney, renderJourney } from './journey/index.js';
import { pickRediscoverMeal, renderRediscover } from './rediscover/index.js';
import { buildPredictions, createPredictionController } from './predictions/index.js';

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
  swipeBusy: false,
  previousView: null,
  selectionHistory: [],
  smartScores: [],
  debugMode: new URLSearchParams(window.location.search).get('debug') === '1'
};

const predictionController = createPredictionController({
  onOpen: meal => {
    state.previousView = 'insightsView';
    openMeal(meal);
  }
});

const rouletteController = createRouletteController({
  onComplete: meal => {
    document.documentElement.classList.add('roulette-morphing');

    window.setTimeout(() => {
      openMeal(meal);

      window.setTimeout(() => {
        document.documentElement.classList.remove('roulette-morphing');
      }, 420);
    }, 90);
  },
  onCancel: () => showView('categoriesView', { direction: 'back' }),
  onPreload: sources => preloadImages(sources),
  onFeedback: () => triggerHaptic([16, 45, 24])
});

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
  onToggleFavorite: meal => handleToggleFavorite(meal),
  onSwipeFeedback: direction => {
    triggerHaptic(direction === 'right' ? [12, 35, 16] : 8);
  },
  onPreload: sources => preloadImages(sources)
});

let toastTimer = null;

const preloadedImages = new Set();

function preloadImages(sources = []) {
  sources.forEach(source => {
    if (!source || preloadedImages.has(source)) return;

    preloadedImages.add(source);
    const image = new Image();
    image.decoding = 'async';
    image.src = source;
  });
}

function triggerHaptic(pattern = 10) {
  if (!('vibrate' in navigator)) return;

  try {
    navigator.vibrate(pattern);
  } catch (error) {
    console.debug('Haptic unavailable:', error);
  }
}

function showToast(message, type = 'info') {
  const toast = el('appToast');

  window.clearTimeout(toastTimer);
  const icon =
    type === 'success'
      ? '❤️'
      : type === 'error'
        ? '⚠️'
        : '✨';

  toast.innerHTML = `
    <span class="app-toast-icon" aria-hidden="true">${icon}</span>
    <span>${message}</span>
  `;
  toast.dataset.type = type;
  toast.classList.remove('hidden', 'is-visible');

  requestAnimationFrame(() => {
    toast.classList.add('is-visible');
  });

  toastTimer = window.setTimeout(() => {
    toast.classList.remove('is-visible');

    window.setTimeout(() => {
      toast.classList.add('hidden');
    }, 220);
  }, 2800);
}

async function startApp() {
  stopLatestSelectionPolling();
  if (!state.role) {
    updateHeaderForRole(null);
    showView('roleView');
    return;
  }

  showView('loadingView', { instant: true });
  try {
    const [rawData, selectionHistory] = await Promise.all([
      fetchAppData(),
      fetchSelectionHistory().catch(error => {
        console.warn('Selection history unavailable:', error);
        return [];
      })
    ]);

    state.selectionHistory = selectionHistory;
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
      state.previousView = null;
      state.selectedCategory = category;
      renderMeals(category);
    });

    card.style.setProperty('--card-index', index);
    grid.appendChild(card);
  });
}

function openFavorites() {
  state.previousView = 'categoriesView';
  renderFavoritesScreen({
    meals: state.meals,
    onOpen: meal => {
      state.previousView = 'favoritesView';
      openMeal(meal);
    },
    onRemove: meal => handleToggleFavorite(meal, { returnToFavorites: true })
  });
  showView('favoritesView');
}

function refreshFavoritesView() {
  renderFavoritesScreen({
    meals: state.meals,
    onOpen: meal => {
      state.previousView = 'favoritesView';
      openMeal(meal);
    },
    onRemove: meal => handleToggleFavorite(meal, { returnToFavorites: true })
  });
}

function openJournal() {
  state.previousView = 'categoriesView';

  renderMealJournal({
    history: state.selectionHistory,
    meals: state.meals,
    container: el('journalList'),
    emptyState: el('journalEmpty'),
    countElement: el('journalCount')
  });

  showView('journalView');
}

function openInsights() {
  state.previousView = 'categoriesView';

  const insights = calculateInsights({
    history: state.selectionHistory,
    meals: state.meals
  });

  const achievements = calculateAchievements({
    history: state.selectionHistory,
    meals: state.meals
  });

  const journey = calculateJourney({
    history: state.selectionHistory,
    achievements
  });

  const rediscoverCandidate = pickRediscoverMeal({
    history: state.selectionHistory,
    meals: state.meals
  });

  const predictions = buildPredictions({
    history: state.selectionHistory,
    meals: state.meals
  });

  renderInsights({
    insights,
    emptyState: el('insightsEmpty'),
    grid: el('insightsGrid')
  });

  renderAchievements({
    achievements,
    container: el('achievementsGrid'),
    summaryElement: el('achievementsSummary')
  });

  renderJourney(journey);
  predictionController.render(predictions);

  renderRediscover({
    candidate: rediscoverCandidate,
    onOpen: meal => {
      state.previousView = 'insightsView';
      openMeal(meal);
    }
  });

  showView('insightsView');
}

function openTimeline() {
  state.previousView = 'categoriesView';

  const entries = buildTimelineEntries({
    history: state.selectionHistory,
    meals: state.meals
  });

  renderTimeline({
    entries,
    container: el('timelineList'),
    emptyState: el('timelineEmpty'),
    countElement: el('timelineCount'),
    onOpen: entry => {
      state.previousView = 'timelineView';
      openMeal(entry.meal);
    }
  });

  showView('timelineView');
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

async function handleToggleFavorite(meal, options = {}) {
  if (!meal || state.role !== 'maayan') return;

  const previousValue = meal.favorite;
  meal.favorite = !meal.favorite;

  triggerHaptic(meal.favorite ? [12, 40, 18] : 10);
  updateFavoriteViews(options);

  requestAnimationFrame(() => {
    document
      .querySelectorAll(`[data-meal-id="${meal.id}"] .swipe-favorite, [data-meal-id="${meal.id}"] .favorite-toggle`)
      .forEach(button => {
        button.classList.remove('heart-pop');
        void button.offsetWidth;
        button.classList.add('heart-pop');
      });
  });

  try {
    const result = await toggleFavorite(meal, 'מעיין');
    meal.favorite = Boolean(result?.Active);
    updateFavoriteViews(options);

    showToast(
      meal.favorite
        ? 'נוסף למועדפים ❤️'
        : 'הוסר מהמועדפים',
      'success'
    );
  } catch (error) {
    console.error('Favorite update failed:', error);
    meal.favorite = previousValue;
    updateFavoriteViews(options);
    showToast(
      error?.message || 'לא הצלחנו לעדכן את המועדפים',
      'error'
    );
  }
}

function updateFavoriteViews(options = {}) {
  if (options.returnToFavorites || !el('favoritesView').classList.contains('hidden')) {
    refreshFavoritesView();
  }

  if (!el('mealsView').classList.contains('hidden')) {
    swipeController.render();
  }
}

function openRandomMeal(meals) {
  if (!meals.length) return;

  const scored = scoreMeals(
    meals,
    state.selectionHistory,
    new Date()
  );

  state.smartScores = scored;
  const picked = pickWeightedMeal(scored);

  if (state.debugMode) {
    renderSmartDebug(scored, picked);
  }

  if (picked?.meal) {
    rouletteController.start({
      meals,
      pickedMeal: picked.meal,
      pickedScore: picked
    });
  }
}

function renderSmartDebug(scoredMeals, picked) {
  const panel = el('smartDebugPanel');
  const content = el('smartDebugContent');

  content.innerHTML = scoredMeals.map(item => {
    const pickedClass =
      picked?.meal?.id === item.meal.id
        ? ' is-picked'
        : '';

    return `
      <article class="smart-debug-row${pickedClass}">
        <div class="smart-debug-title">
          <strong>${item.meal.name}</strong>
          <span>${item.score}</span>
        </div>
        <small>${item.reasons.join(' • ')}</small>
      </article>
    `;
  }).join('');

  panel.classList.remove('hidden');
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
    const savedSelection = result.selection || {
      MealID: meal.id,
      MealName: meal.name,
      User: 'מעיין',
      Date: new Date().toISOString()
    };

    saveLatestSelection(savedSelection);
    state.selectionHistory.push(savedSelection);
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
el('openFavoritesBtn').addEventListener('click', openFavorites);
el('openJournalBtn').addEventListener('click', openJournal);
el('openInsightsBtn').addEventListener('click', openInsights);
el('openTimelineBtn').addEventListener('click', openTimeline);
el('favoritesHomeBtn').addEventListener('click', () => showView('categoriesView'));
el('journalHomeBtn').addEventListener('click', () => showView('categoriesView'));
el('insightsHomeBtn').addEventListener('click', () => showView('categoriesView'));
el('timelineHomeBtn').addEventListener('click', () => showView('categoriesView'));
el('confirmBtn').addEventListener('click', confirmSelection);
el('homeBtn').addEventListener('click', () => { state.previousView = null; showView('categoriesView'); });
el('retryBtn').addEventListener('click', startApp);

el('closeSmartDebugBtn')?.addEventListener('click', () => {
  el('smartDebugPanel').classList.add('hidden');
});

el('skipMealBtn').addEventListener('click', () => {
  const meal = state.swipeMeals[state.swipeIndex];
  triggerHaptic(8);
  swipeController.swipe('left', meal);
});

el('chooseMealBtn').addEventListener('click', () => {
  const meal = state.swipeMeals[state.swipeIndex];
  triggerHaptic([12, 35, 16]);
  swipeController.swipe('right', meal);
});

el('shuffleDeckBtn').addEventListener('click', () => {
  const scored = scoreMeals(
    state.swipeMeals,
    state.selectionHistory,
    new Date()
  );

  state.smartScores = scored;

  state.swipeMeals = scored
    .map(item => ({
      meal: item.meal,
      sortKey: item.score + Math.random() * 35
    }))
    .sort((a, b) => b.sortKey - a.sortKey)
    .map(item => item.meal);

  state.swipeIndex = 0;
  state.swipeBusy = false;

  if (state.debugMode) {
    renderSmartDebug(scored, null);
  }

  swipeController.render();
});

el('backBtn').addEventListener('click', () => {
  const choiceViewOpen = !el('choiceView').classList.contains('hidden');
  const mealsViewOpen = !el('mealsView').classList.contains('hidden');
  const favoritesViewOpen = !el('favoritesView').classList.contains('hidden');
  const journalViewOpen = !el('journalView').classList.contains('hidden');
  const insightsViewOpen = !el('insightsView').classList.contains('hidden');
  const timelineViewOpen = !el('timelineView').classList.contains('hidden');

  if (choiceViewOpen && state.previousView === 'favoritesView') {
    state.selectedMeal = null;
    refreshFavoritesView();
    showView('favoritesView', { direction: 'back' });
    return;
  }

  if (choiceViewOpen && state.previousView === 'timelineView') {
    state.selectedMeal = null;
    openTimeline();
    return;
  }

  if (choiceViewOpen && state.previousView === 'insightsView') {
    state.selectedMeal = null;
    openInsights();
    return;
  }

  if (favoritesViewOpen) {
    state.previousView = null;
    showView('categoriesView', { direction: 'back' });
    return;
  }

  if (journalViewOpen) {
    state.previousView = null;
    showView('categoriesView', { direction: 'back' });
    return;
  }

  if (insightsViewOpen) {
    state.previousView = null;
    showView('categoriesView', { direction: 'back' });
    return;
  }

  if (timelineViewOpen) {
    state.previousView = null;
    showView('categoriesView', { direction: 'back' });
    return;
  }

  if (choiceViewOpen && state.selectedCategory) {
    state.swipeBusy = false;
    state.selectedMeal = null;
    swipeController.render();
    showView('mealsView', { direction: 'back' });
    return;
  }

  if (mealsViewOpen) {
    state.selectedCategory = null;
    state.swipeMeals = [];
    state.swipeIndex = 0;
    state.swipeBusy = false;
    showView('categoriesView', { direction: 'back' });
    return;
  }

  showView('categoriesView');
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js'));
}

startApp();
