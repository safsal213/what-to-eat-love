import { escapeHtml } from './utils.js';

export function renderMealJournal({
  history = [],
  meals = [],
  container,
  emptyState,
  countElement
}) {
  if (!container || !emptyState || !countElement) return;

  const mealMap = new Map(
    meals.map(meal => [String(meal.id), meal])
  );

  const entries = history
    .map(selection => normalizeEntry(selection, mealMap))
    .filter(Boolean)
    .sort((a, b) => b.date - a.date);

  container.innerHTML = '';
  countElement.textContent = formatCount(entries.length);

  if (!entries.length) {
    container.classList.add('hidden');
    emptyState.classList.remove('hidden');
    return;
  }

  container.classList.remove('hidden');
  emptyState.classList.add('hidden');

  groupByDay(entries).forEach(group => {
    const section = document.createElement('section');
    section.className = 'journal-day';

    section.innerHTML = `
      <div class="journal-day-heading">
        <strong>${escapeHtml(group.label)}</strong>
        <span>${group.items.length} ${group.items.length === 1 ? 'בחירה' : 'בחירות'}</span>
      </div>
      <div class="journal-day-items"></div>
    `;

    const list = section.querySelector('.journal-day-items');

    group.items.forEach(entry => {
      const card = document.createElement('article');
      card.className = 'journal-item';

      card.innerHTML = `
        <div class="journal-image-wrap">
          <span class="journal-emoji">${escapeHtml(entry.emoji)}</span>
          ${entry.image ? `<img src="${escapeHtml(entry.image)}" alt="">` : ''}
        </div>

        <div class="journal-item-copy">
          <div class="journal-item-title-row">
            <h3>${escapeHtml(entry.name)}</h3>
            <time datetime="${entry.date.toISOString()}">
              ${escapeHtml(formatTime(entry.date))}
            </time>
          </div>

          <p>${escapeHtml(entry.description || 'בחירה טעימה שנשמרה ביומן')}</p>

          <div class="journal-meta">
            <span>👤 ${escapeHtml(entry.user)}</span>
            ${entry.status ? `<span>🏷️ ${escapeHtml(entry.status)}</span>` : ''}
          </div>
        </div>
      `;

      const image = card.querySelector('img');

      if (image) {
        image.loading = 'lazy';
        image.decoding = 'async';
        image.onload = () => card.classList.add('has-image');
        image.onerror = () => image.remove();
      }

      list.appendChild(card);
    });

    container.appendChild(section);
  });
}

function normalizeEntry(selection, mealMap) {
  const mealId = String(
    selection?.MealID ??
    selection?.mealId ??
    selection?.id ??
    ''
  ).trim();

  const date = parseDate(
    selection?.Date ??
    selection?.SelectedAt ??
    selection?.selectedAt ??
    selection?.CreatedAt
  );

  if (!date) return null;

  const meal = mealMap.get(mealId) || {};

  return {
    id:
      selection?.SelectionID ||
      selection?.id ||
      `${mealId}-${date.getTime()}`,
    name:
      selection?.MealName ||
      selection?.mealName ||
      meal.name ||
      'מנה שנבחרה',
    image: meal.image || '',
    emoji: meal.emoji || '🍽️',
    description: meal.description || '',
    user: selection?.User || selection?.selectedBy || 'מעיין',
    status: selection?.Status || selection?.status || '',
    date
  };
}

function parseDate(value) {
  if (!value) return null;

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  const direct = new Date(value);

  if (!Number.isNaN(direct.getTime())) {
    return direct;
  }

  const text = String(value).trim();
  const match = text.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/
  );

  if (!match) return null;

  const [, day, month, year, hour = '0', minute = '0', second = '0'] = match;
  const parsed = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second)
  );

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function groupByDay(entries) {
  const formatter = new Intl.DateTimeFormat('he-IL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });

  const groups = [];
  const groupMap = new Map();

  entries.forEach(entry => {
    const key = [
      entry.date.getFullYear(),
      entry.date.getMonth(),
      entry.date.getDate()
    ].join('-');

    if (!groupMap.has(key)) {
      const group = {
        label: formatter.format(entry.date),
        items: []
      };

      groupMap.set(key, group);
      groups.push(group);
    }

    groupMap.get(key).items.push(entry);
  });

  return groups;
}

function formatTime(date) {
  return new Intl.DateTimeFormat('he-IL', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

function formatCount(count) {
  if (count === 1) return 'ארוחה אחת';
  return `${count} ארוחות`;
}
