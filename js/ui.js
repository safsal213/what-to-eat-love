const VIEW_IDS = [
  'loadingView',
  'errorView',
  'categoriesView',
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

export function setImageWithFallback(imageElement, source, fallbackElement) {
  fallbackElement?.classList.remove('hidden');
  imageElement.classList.remove('hidden');

  if (!source) {
    imageElement.classList.add('hidden');
    return;
  }

  imageElement.src = source;
  imageElement.onload = () => fallbackElement?.classList.add('hidden');
  imageElement.onerror = () => imageElement.classList.add('hidden');
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
