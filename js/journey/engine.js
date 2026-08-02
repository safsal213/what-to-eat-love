export function calculateJourney({
  history = [],
  achievements = []
}) {
  const dates = history
    .map(selection =>
      parseDate(
        selection?.Date ??
        selection?.SelectedAt ??
        selection?.selectedAt ??
        selection?.CreatedAt
      )
    )
    .filter(Boolean)
    .sort((a, b) => a - b);

  const uniqueMeals = new Set(
    history
      .map(selection =>
        String(
          selection?.MealID ??
          selection?.mealId ??
          selection?.id ??
          ''
        ).trim()
      )
      .filter(Boolean)
  );

  const unlockedAchievements = achievements.filter(
    achievement => achievement.unlocked
  ).length;

  return {
    days: dates.length
      ? Math.max(
          1,
          Math.floor(
            (startOfDay(new Date()) - startOfDay(dates[0])) /
            86400000
          ) + 1
        )
      : 0,
    meals: history.length,
    uniqueMeals: uniqueMeals.size,
    unlockedAchievements
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
