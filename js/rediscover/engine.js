export function pickRediscoverMeal({
  history = [],
  meals = [],
  now = new Date()
}) {
  if (!history.length || !meals.length) return null;

  const mealMap = new Map(
    meals.map(meal => [String(meal.id), meal])
  );

  const stats = new Map();

  history.forEach(selection => {
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

    if (!mealId || !date || !mealMap.has(mealId)) return;

    const current = stats.get(mealId) || {
      count: 0,
      lastDate: null
    };

    current.count += 1;

    if (!current.lastDate || date > current.lastDate) {
      current.lastDate = date;
    }

    stats.set(mealId, current);
  });

  const candidates = [...stats.entries()]
    .map(([mealId, stat]) => {
      const meal = mealMap.get(mealId);
      const daysSince = Math.max(
        0,
        Math.floor(
          (startOfDay(now) - startOfDay(stat.lastDate)) /
          86400000
        )
      );

      const score =
        daysSince * 4 +
        Math.min(stat.count, 8) * 3 +
        (meal.favorite ? 14 : 0);

      return {
        meal,
        daysSince,
        count: stat.count,
        score
      };
    })
    .filter(candidate => candidate.daysSince >= 7)
    .sort((a, b) => b.score - a.score);

  return candidates[0] || null;
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

  const match = String(value).trim().match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/
  );

  if (!match) return null;

  const [, day, month, year, hour = '0', minute = '0', second = '0'] = match;
  const parsed = new Date(+year, +month - 1, +day, +hour, +minute, +second);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function startOfDay(date) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );
}
