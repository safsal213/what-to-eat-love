/**
 * Sprint 4.1 — Smart Shuffle scoring engine
 *
 * This module calculates a score for each meal.
 * It does not yet replace the current random selection.
 */

export const DEFAULT_SCORING_RULES = Object.freeze({
  baseScore: 100,
  favoriteBonus: 50,
  selectedTodayPenalty: -1000,
  selectedThisWeekPenalty: -30,
  notSelectedForMonthBonus: 20,
  neverSelectedBonus: 12,
  minimumScore: 1
});

/**
 * Calculates a smart score for one meal.
 *
 * @param {object} meal
 * @param {Array<object>} history
 * @param {Date} now
 * @param {object} rules
 * @returns {{
 *   meal: object,
 *   score: number,
 *   reasons: string[],
 *   lastSelectedAt: string | null,
 *   selectedToday: boolean,
 *   selectedThisWeek: boolean
 * }}
 */
export function scoreMeal(
  meal,
  history = [],
  now = new Date(),
  rules = DEFAULT_SCORING_RULES
) {
  const relevantSelections = history
    .filter(selection => getSelectionMealId(selection) === String(meal.id))
    .map(selection => ({
      ...selection,
      parsedDate: parseSelectionDate(selection)
    }))
    .filter(selection => selection.parsedDate instanceof Date &&
      !Number.isNaN(selection.parsedDate.getTime()))
    .sort((a, b) => b.parsedDate - a.parsedDate);

  const latestSelection = relevantSelections[0] || null;
  const lastSelectedAt = latestSelection?.parsedDate || null;
  const selectedToday = lastSelectedAt
    ? isSameLocalDay(lastSelectedAt, now)
    : false;
  const selectedThisWeek = lastSelectedAt
    ? isWithinDays(lastSelectedAt, now, 7)
    : false;
  const notSelectedForMonth = lastSelectedAt
    ? !isWithinDays(lastSelectedAt, now, 30)
    : false;

  let score = rules.baseScore;
  const reasons = [`ניקוד בסיסי +${rules.baseScore}`];

  if (meal.favorite) {
    score += rules.favoriteBonus;
    reasons.push(`מועדפת +${rules.favoriteBonus}`);
  }

  if (!lastSelectedAt) {
    score += rules.neverSelectedBonus;
    reasons.push(`טרם נבחרה +${rules.neverSelectedBonus}`);
  } else if (selectedToday) {
    score += rules.selectedTodayPenalty;
    reasons.push(`נבחרה היום ${rules.selectedTodayPenalty}`);
  } else if (selectedThisWeek) {
    score += rules.selectedThisWeekPenalty;
    reasons.push(`נבחרה השבוע ${rules.selectedThisWeekPenalty}`);
  } else if (notSelectedForMonth) {
    score += rules.notSelectedForMonthBonus;
    reasons.push(`לא נבחרה חודש +${rules.notSelectedForMonthBonus}`);
  }

  return {
    meal,
    score: Math.max(rules.minimumScore, Math.round(score)),
    reasons,
    lastSelectedAt: lastSelectedAt?.toISOString() || null,
    selectedToday,
    selectedThisWeek
  };
}

/**
 * Scores and sorts all meals from highest to lowest.
 */
export function scoreMeals(
  meals = [],
  history = [],
  now = new Date(),
  rules = DEFAULT_SCORING_RULES
) {
  return meals
    .map(meal => scoreMeal(meal, history, now, rules))
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      return String(a.meal.name || '').localeCompare(
        String(b.meal.name || ''),
        'he'
      );
    });
}

/**
 * Keeps meals selected today out of the pool when alternatives exist.
 * This function is prepared for Sprint 4.2.
 */
export function buildEligiblePool(scoredMeals = []) {
  const notSelectedToday = scoredMeals.filter(item => !item.selectedToday);

  return notSelectedToday.length > 0
    ? notSelectedToday
    : scoredMeals;
}

/**
 * Weighted random selector, prepared for Sprint 4.2.
 * It is intentionally not connected to the UI yet.
 */
export function pickWeightedMeal(scoredMeals = [], random = Math.random) {
  const eligible = buildEligiblePool(scoredMeals);

  if (!eligible.length) {
    return null;
  }

  const totalWeight = eligible.reduce(
    (sum, item) => sum + Math.max(1, item.score),
    0
  );

  let threshold = random() * totalWeight;

  for (const item of eligible) {
    threshold -= Math.max(1, item.score);

    if (threshold <= 0) {
      return item;
    }
  }

  return eligible[eligible.length - 1];
}

function getSelectionMealId(selection) {
  return String(
    selection?.MealID ??
    selection?.mealId ??
    selection?.id ??
    ''
  ).trim();
}

function parseSelectionDate(selection) {
  const rawValue =
    selection?.Date ??
    selection?.SelectedAt ??
    selection?.selectedAt ??
    selection?.CreatedAt ??
    null;

  if (!rawValue) {
    return null;
  }

  if (rawValue instanceof Date) {
    return rawValue;
  }

  const directDate = new Date(rawValue);

  if (!Number.isNaN(directDate.getTime())) {
    return directDate;
  }

  const text = String(rawValue).trim();
  const match = text.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/
  );

  if (!match) {
    return null;
  }

  const [, day, month, year, hour = '0', minute = '0', second = '0'] = match;

  return new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second)
  );
}

function isSameLocalDay(firstDate, secondDate) {
  return firstDate.getFullYear() === secondDate.getFullYear() &&
    firstDate.getMonth() === secondDate.getMonth() &&
    firstDate.getDate() === secondDate.getDate();
}

function isWithinDays(date, now, days) {
  const milliseconds = now.getTime() - date.getTime();

  return milliseconds >= 0 &&
    milliseconds <= days * 24 * 60 * 60 * 1000;
}
