import { el, setImageWithFallback } from './ui.js';

export function renderFavoritesScreen({ meals, onOpen, onRemove }) {
  const favorites = meals.filter(meal => meal.favorite);
  const grid = el('favoritesGrid');
  const empty = el('favoritesEmpty');
  const count = el('favoritesCount');

  grid.innerHTML = '';
  count.textContent = `${favorites.length} ${favorites.length === 1 ? 'מנה' : 'מנות'}`;
  grid.classList.toggle('hidden', favorites.length === 0);
  empty.classList.toggle('hidden', favorites.length > 0);

  favorites.forEach((meal, index) => {
    const card = createFavoriteCard(meal, { onOpen, onRemove });
    card.style.setProperty('--favorite-index', index);
    grid.appendChild(card);
  });
}

function createFavoriteCard(meal, { onOpen, onRemove }) {
  const card = document.createElement('article');
  card.className = 'favorite-card';

  const imageWrap = document.createElement('button');
  imageWrap.type = 'button';
  imageWrap.className = 'favorite-image-wrap';
  imageWrap.setAttribute('aria-label', `פתחי את ${meal.name}`);

  const image = document.createElement('img');
  image.alt = '';

  const emoji = document.createElement('span');
  emoji.className = 'favorite-emoji';
  emoji.textContent = meal.emoji || '🍽️';

  setImageWithFallback(image, meal.image, emoji);
  imageWrap.append(image, emoji);

  const content = document.createElement('div');
  content.className = 'favorite-card-content';

  const titleRow = document.createElement('div');
  titleRow.className = 'favorite-title-row';

  const title = document.createElement('h3');
  title.textContent = meal.name;

  const remove = document.createElement('button');
  remove.type = 'button';
  remove.className = 'favorite-remove-btn';
  remove.textContent = '❤️';
  remove.setAttribute('aria-label', `הסירי את ${meal.name} מהמועדפים`);

  const description = document.createElement('p');
  description.textContent = meal.description || 'נשמע טעים 😋';

  const meta = document.createElement('div');
  meta.className = 'favorite-meta';
  if (meal.preparationTime) meta.appendChild(makePill(`⏱️ ${meal.preparationTime} דקות`));
  if (meal.pregnancySafe) meta.appendChild(makePill('🤰 מתאים בהיריון'));

  titleRow.append(title, remove);
  content.append(titleRow, description, meta);
  card.append(imageWrap, content);

  imageWrap.addEventListener('click', () => onOpen(meal));
  remove.addEventListener('click', async () => {
    remove.disabled = true;
    await onRemove(meal);
  });

  return card;
}

function makePill(text) {
  const pill = document.createElement('span');
  pill.className = 'meta-pill';
  pill.textContent = text;
  return pill;
}
