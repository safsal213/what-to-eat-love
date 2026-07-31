const CATEGORY_EMOJIS = {
  breakfast: '🍳',
  lunch: '🍝',
  dinner: '🥗',
  snack: '🍓',
  dessert: '🍰',
  drink: '🥤',
  surprise: '🎲'
};

const CATEGORY_DESCRIPTIONS = {
  breakfast: 'להתחיל את היום',
  lunch: 'ארוחה משביעה',
  dinner: 'לסיים את היום',
  snack: 'משהו קטן',
  dessert: 'משהו מתוק',
  drink: 'משהו לשתות',
  surprise: 'תבחר לי'
};

export function normalizeAppData(raw) {
  const categories = (raw.categories || [])
    .filter(item => isActive(item))
    .map(item => ({
      key: clean(item.CategoryKey),
      name: clean(item.Name || item['שם']),
      description: clean(item.Description || item['תיאור']) || CATEGORY_DESCRIPTIONS[clean(item.CategoryKey)] || '',
      image: normalizeImage(item.Image || item['תמונה'], 'categories'),
      emoji: clean(item.Icon || item['אייקון']) || CATEGORY_EMOJIS[clean(item.CategoryKey)] || '🍽️',
      order: toNumber(item.Order || item['סדר'])
    }))
    .filter(item => item.key && item.name)
    .sort((a, b) => a.order - b.order);

  const meals = (raw.meals || [])
    .filter(item => isActive(item))
    .map(item => ({
      id: clean(item.MealID),
      name: clean(item.Name),
      category: clean(item.CategoryKey),
      description: clean(item.Description),
      image: normalizeImage(item.Image, 'meals'),
      pregnancySafe: toBoolean(item.PregnancySafe),
      trimester: clean(item.Trimester),
      preparationTime: clean(item.PreparationTime),
      calories: clean(item.Calories),
      favorite: toBoolean(item.Favorite),
      order: toNumber(item.DisplayOrder),
      emoji: '🍽️'
    }))
    .filter(item => item.id && item.name && item.category)
    .sort((a, b) => a.order - b.order);

  return {
    categories,
    meals,
    settings: raw.settings || {}
  };
}

function isActive(item) {
  if (!Object.prototype.hasOwnProperty.call(item, 'Active') &&
      !Object.prototype.hasOwnProperty.call(item, 'פעיל')) {
    return true;
  }
  return toBoolean(item.Active ?? item['פעיל']);
}

function normalizeImage(value, folder) {
  const image = clean(value);
  if (!image) return '';
  if (/^https?:\/\//i.test(image) || image.startsWith('data:')) return image;
  if (image.startsWith('images/')) return image;
  return `images/${folder}/${image}`;
}

function clean(value) {
  return String(value ?? '').trim();
}

function toBoolean(value) {
  if (typeof value === 'boolean') return value;
  const text = clean(value).toLowerCase();
  return ['true', '1', 'yes', 'כן', 'on'].includes(text);
}

function toNumber(value) {
  const number = Number(clean(value));
  return Number.isFinite(number) ? number : 9999;
}
