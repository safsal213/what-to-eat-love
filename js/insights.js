export function calculateInsights({
  history = [],
  meals = []
}) {
  const mealMap = new Map(
    meals.map(meal => [String(meal.id), meal])
  );

  const entries = history
    .map(selection => normalizeSelection(selection, mealMap))
    .filter(Boolean)
    .sort((a, b) => b.date - a.date);

  if (!entries.length) {
    return {
      totalSelections: 0,
      monthSelections: 0,
      currentStreak: 0,
      topMeal: null,
      topCategory: null,
      favoritesShare: 0,
      weeklyData: [],
      insightText: 'עוד רגע נכיר את ההרגלים שלכם'
    };
  }

  const now = new Date();
  const currentMonthEntries = entries.filter(entry =>
    entry.date.getFullYear() === now.getFullYear() &&
    entry.date.getMonth() === now.getMonth()
  );

  const mealCounts = countBy(entries, entry => entry.mealId || entry.name);
  const categoryCounts = countBy(
    entries.filter(entry => entry.category),
    entry => entry.category
  );

  const topMealKey = getTopKey(mealCounts);
  const topMealEntry = entries.find(entry =>
    (entry.mealId || entry.name) === topMealKey
  );

  const topCategoryKey = getTopKey(categoryCounts);

  const favoriteSelections = entries.filter(entry => entry.favorite).length;

  const weeklyData = buildWeeklyData(entries, now);

  return {
    totalSelections: entries.length,
    monthSelections: currentMonthEntries.length,
    currentStreak: calculateCurrentStreak(entries),
    topMeal: topMealKey
      ? {
          name: topMealEntry?.name || 'מנה מובילה',
          count: mealCounts.get(topMealKey) || 0
        }
      : null,
    topCategory: topCategoryKey
      ? {
          name: getCategoryName(topCategoryKey),
          count: categoryCounts.get(topCategoryKey) || 0
        }
      : null,
    favoritesShare: Math.round(
      (favoriteSelections / entries.length) * 100
    ),
    weeklyData,
    insightText: buildInsightText({
      entries,
      currentMonthEntries,
      favoriteSelections,
      topMealName: topMealEntry?.name || '',
      currentStreak: calculateCurrentStreak(entries)
    })
  };
}

export function renderInsights({
  insights,
  emptyState,
  grid
}) {
  const hasData = insights.totalSelections > 0;

  grid?.classList.toggle('hidden', !hasData);
  emptyState?.classList.toggle('hidden', hasData);

  if (!hasData) return;

  setText('topMealName', insights.topMeal?.name || '—');
  setText(
    'topMealCount',
    `${insights.topMeal?.count || 0} פעמים`
  );

  setText(
    'currentStreak',
    `${insights.currentStreak} ${
      insights.currentStreak === 1 ? 'יום' : 'ימים'
    }`
  );

  setText('monthSelections', insights.monthSelections);
  setText('favoritesShare', `${insights.favoritesShare}%`);
  setText('totalSelections', insights.totalSelections);

  setText(
    'topCategory',
    insights.topCategory?.name || '—'
  );

  setText(
    'topCategoryCount',
    `${insights.topCategory?.count || 0} בחירות`
  );

  setText(
    'insightOfDayText',
    insights.insightText || 'ההרגלים שלכם מתחילים לקבל צורה'
  );

  animateCounters(insights);
  renderWeeklyChart(insights.weeklyData || []);
}

function buildInsightText({
  entries,
  currentMonthEntries,
  favoriteSelections,
  topMealName,
  currentStreak
}) {
  if (!entries.length) {
    return 'עוד רגע נכיר את ההרגלים שלכם';
  }

  const favoriteShare = Math.round(
    (favoriteSelections / entries.length) * 100
  );

  if (currentStreak >= 3) {
    return `🔥 אתם כבר ${currentStreak} ימים ברצף בוחרים יחד ארוחה`;
  }

  if (favoriteShare >= 60) {
    return '❤️ לאחרונה אתם בוחרים הרבה מתוך המועדפים';
  }

  if (topMealName) {
    return `🏆 נראה ש־${topMealName} היא המנה המנצחת שלכם`;
  }

  if (currentMonthEntries.length >= 10) {
    return `🍽️ החודש כבר בחרתם ${currentMonthEntries.length} ארוחות`;
  }

  return '🧠 Smart Shuffle מתחיל ללמוד את ההעדפות שלכם';
}

function buildWeeklyData(entries, now) {
  const labels = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];
  const result = [];

  for (let offset = 6; offset >= 0; offset -= 1) {
    const day = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - offset
    );

    const count = entries.filter(entry =>
      entry.date.getFullYear() === day.getFullYear() &&
      entry.date.getMonth() === day.getMonth() &&
      entry.date.getDate() === day.getDate()
    ).length;

    result.push({
      label: labels[day.getDay()],
      count
    });
  }

  return result;
}

function renderWeeklyChart(weeklyData) {
  const chart = document.getElementById('weeklyChart');
  if (!chart) return;

  const max = Math.max(1, ...weeklyData.map(item => item.count));
  const total = weeklyData.reduce((sum, item) => sum + item.count, 0);

  setText('weeklyTotal', `${total} ${total === 1 ? 'בחירה' : 'בחירות'}`);

  chart.innerHTML = weeklyData.map(item => {
    const height = Math.max(
      item.count ? 18 : 6,
      Math.round((item.count / max) * 100)
    );

    return `
      <div class="weekly-bar-column">
        <div class="weekly-bar-track">
          <div
            class="weekly-bar"
            style="--bar-height:${height}%"
            title="${item.count} בחירות"
          ></div>
        </div>
        <strong>${item.label}</strong>
        <small>${item.count}</small>
      </div>
    `;
  }).join('');

  requestAnimationFrame(() => {
    chart.querySelectorAll('.weekly-bar').forEach(bar => {
      bar.classList.add('is-visible');
    });
  });
}

function animateCounters(insights) {
  const targets = [
    ['monthSelections', insights.monthSelections],
    ['favoritesShare', insights.favoritesShare, '%'],
    ['totalSelections', insights.totalSelections]
  ];

  targets.forEach(([id, target, suffix = '']) => {
    const element = document.getElementById(id);
    if (!element) return;

    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    if (reducedMotion) {
      element.textContent = `${target}${suffix}`;
      return;
    }

    const duration = 700;
    const start = performance.now();

    function tick(now) {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      element.textContent = `${Math.round(target * eased)}${suffix}`;

      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    }

    requestAnimationFrame(tick);
  });
}

function normalizeSelection(selection, mealMap) {
  const mealId = String(
    selection?.MealID ??
    selection?.mealId ??
    selection?.id ??
    ''
  ).trim();

  const meal = mealMap.get(mealId) || {};
  const date = parseDate(
    selection?.Date ??
    selection?.SelectedAt ??
    selection?.selectedAt ??
    selection?.CreatedAt
  );

  if (!date) return null;

  return {
    mealId,
    name:
      selection?.MealName ||
      selection?.mealName ||
      meal.name ||
      'מנה שנבחרה',
    category: meal.category || '',
    favorite: Boolean(meal.favorite),
    date
  };
}

function countBy(items, getKey) {
  const map = new Map();

  items.forEach(item => {
    const key = getKey(item);

    if (!key) return;

    map.set(key, (map.get(key) || 0) + 1);
  });

  return map;
}

function getTopKey(map) {
  let topKey = null;
  let topCount = -1;

  map.forEach((count, key) => {
    if (count > topCount) {
      topKey = key;
      topCount = count;
    }
  });

  return topKey;
}

function calculateCurrentStreak(entries) {
  const uniqueDays = [...new Set(
    entries.map(entry => dayKey(entry.date))
  )]
    .map(key => new Date(`${key}T12:00:00`))
    .sort((a, b) => b - a);

  if (!uniqueDays.length) return 0;

  const today = startOfDay(new Date());
  const latestDay = startOfDay(uniqueDays[0]);
  const daysFromToday = differenceInDays(today, latestDay);

  if (daysFromToday > 1) return 0;

  let streak = 1;

  for (let index = 1; index < uniqueDays.length; index += 1) {
    const previous = startOfDay(uniqueDays[index - 1]);
    const current = startOfDay(uniqueDays[index]);

    if (differenceInDays(previous, current) === 1) {
      streak += 1;
    } else {
      break;
    }
  }

  return streak;
}

function dayKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function startOfDay(date) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );
}

function differenceInDays(later, earlier) {
  return Math.round(
    (later.getTime() - earlier.getTime()) /
    (24 * 60 * 60 * 1000)
  );
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

function getCategoryName(category) {
  const names = {
    breakfast: 'בוקר',
    lunch: 'צהריים',
    dinner: 'ערב',
    snack: 'נשנוש',
    dessert: 'קינוח',
    drink: 'שתייה',
    surprise: 'הפתעה'
  };

  return names[category] || category || 'אחר';
}

function setText(id, value) {
  const element = document.getElementById(id);

  if (element) {
    element.textContent = String(value);
  }
}
