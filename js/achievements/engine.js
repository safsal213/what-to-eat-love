import { ACHIEVEMENT_DEFINITIONS } from './definitions.js';

/**
 * Calculate all achievement progress from the existing app data.
 */
export function calculateAchievements({
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

  const metrics = buildMetrics(entries);

  return ACHIEVEMENT_DEFINITIONS.map(definition => {
    const progress = getProgress(definition.type, metrics);
    const cappedProgress = Math.min(progress, definition.goal);
    const percent = definition.goal > 0
      ? Math.round((cappedProgress / definition.goal) * 100)
      : 100;

    return {
      ...definition,
      progress,
      cappedProgress,
      percent,
      unlocked: progress >= definition.goal,
      remaining: Math.max(0, definition.goal - progress)
    };
  });
}

function buildMetrics(entries) {
  const uniqueMeals = new Set();
  const mealCounts = new Map();
  let favoriteSelections = 0;

  entries.forEach(entry => {
    const key = entry.mealId || entry.name;

    if (key) {
      uniqueMeals.add(key);
      mealCounts.set(key, (mealCounts.get(key) || 0) + 1);
    }

    if (entry.favorite) {
      favoriteSelections += 1;
    }
  });

  const topMealCount = mealCounts.size
    ? Math.max(...mealCounts.values())
    : 0;

  return {
    totalSelections: entries.length,
    uniqueMeals: uniqueMeals.size,
    favoriteSelections,
    dailyStreak: calculateCurrentStreak(entries),
    topMealCount
  };
}

function getProgress(type, metrics) {
  const map = {
    total_selections: metrics.totalSelections,
    unique_meals: metrics.uniqueMeals,
    favorite_selections: metrics.favoriteSelections,
    daily_streak: metrics.dailyStreak,
    top_meal_count: metrics.topMealCount
  };

  return Number(map[type] || 0);
}

function normalizeSelection(selection, mealMap) {
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
    mealId,
    name:
      selection?.MealName ||
      selection?.mealName ||
      meal.name ||
      'מנה שנבחרה',
    favorite: Boolean(meal.favorite),
    date
  };
}

function calculateCurrentStreak(entries) {
  const uniqueDays = [...new Set(
    entries.map(entry => toDayKey(entry.date))
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

function toDayKey(date) {
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
