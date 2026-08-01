const VIEW_IDS = [
  'loadingView',
  'errorView',
  'categoriesView',
  'favoritesView',
  'mealsView',
  'choiceView',
  'successView',
  'roleView',
  'haimView'
];

export const el = id => document.getElementById(id);

export function showView(viewId) {
  VIEW_IDS.forEach(id => el(id).classList.toggle('hidden', id !== viewId));
  el('backBtn').classList.toggle(
    'hidden',
    ['loadingView', 'errorView', 'categoriesView', 'successView', 'roleView', 'haimView'].includes(viewId)
  );
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

export function createCard(item, onClick) {
  const card = el('cardTemplate').content.firstElementChild.cloneNode(true);
  card.querySelector('h3').textContent = item.name;
  card.querySelector('p').textContent = item.description || '';

  const image = card.querySelector('img');
  const fallback = card.querySelector('.fallback-emoji');
  fallback.textContent = item.emoji || '🍽️';

  setImageWithFallback(image, item.image, fallback);
  card.addEventListener('click', onClick);
  return card;
}

export function createCategoryCard(category, mealCount, onClick) {
  const card = document.createElement('button');
  card.type = 'button';
  card.className = 'category-card';
  card.dataset.category = category.key || 'default';

  const visual = document.createElement('div');
  visual.className = 'category-visual';

  const image = document.createElement('img');
  image.className = 'category-image';
  image.alt = '';

  const emoji = document.createElement('span');
  emoji.className = 'category-emoji';
  emoji.textContent = category.emoji || '🍽️';

  const overlay = document.createElement('div');
  overlay.className = 'category-overlay';

  const count = document.createElement('span');
  count.className = 'category-count';
  count.textContent = category.key === 'surprise'
    ? 'בחירה אקראית'
    : `${mealCount} ${mealCount === 1 ? 'מנה' : 'מנות'}`;

  const content = document.createElement('div');
  content.className = 'category-content';

  const title = document.createElement('h3');
  title.textContent = category.name;

  const description = document.createElement('p');
  description.textContent = category.description || '';

  visual.append(image, emoji, overlay, count);
  content.append(title, description);
  card.append(visual, content);

  const validImage = category.image &&
    !String(category.image).includes('#') &&
    !String(category.image).startsWith('images/categories/#');

  if (validImage) {
    image.src = category.image;
    image.onload = () => {
      image.classList.add('is-loaded');
      emoji.classList.add('is-hidden');
    };
    image.onerror = () => image.remove();
  } else {
    image.remove();
  }

  card.addEventListener('click', onClick);
  return card;
}

export function setImageWithFallback(imageElement, source, fallbackElement) {
  const container = imageElement.closest(
    '.image-wrap, .choice-image-wrap, .swipe-card-image, .favorite-card-image'
  );

  container?.classList.add('is-loading');
  container?.classList.remove('is-loaded', 'has-error');
  fallbackElement?.classList.remove('hidden');
  imageElement.classList.remove('hidden', 'is-loaded');

  if (!source) {
    imageElement.classList.add('hidden');
    container?.classList.remove('is-loading');
    container?.classList.add('has-error');
    return;
  }

  imageElement.loading = 'lazy';
  imageElement.decoding = 'async';
  imageElement.src = source;

  imageElement.onload = () => {
    imageElement.classList.add('is-loaded');
    fallbackElement?.classList.add('hidden');
    container?.classList.remove('is-loading', 'has-error');
    container?.classList.add('is-loaded');
  };

  imageElement.onerror = () => {
    imageElement.classList.add('hidden');
    fallbackElement?.classList.remove('hidden');
    container?.classList.remove('is-loading', 'is-loaded');
    container?.classList.add('has-error');
  };
}

export function renderMeta(meal) {
  const container = el('choiceMeta');
  container.innerHTML = '';

  const values = [];
  if (meal.preparationTime) values.push(`⏱️ ${meal.preparationTime} דקות`);
  if (meal.calories) values.push(`🔥 ${meal.calories} קלוריות`);
  if (meal.pregnancySafe) values.push('🤰 מתאים בהיריון');
  if (meal.trimester) values.push(`שליש: ${meal.trimester}`);

  values.forEach(text => {
    const pill = document.createElement('span');
    pill.className = 'meta-pill';
    pill.textContent = text;
    container.appendChild(pill);
  });
}

export function showError(message) {
  el('errorText').textContent = message;
  showView('errorView');
}
