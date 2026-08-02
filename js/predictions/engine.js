export function buildPredictions({
  history = [],
  meals = [],
  now = new Date()
}) {
  const mealMap = new Map(
    meals.map(meal => [String(meal.id), meal])
  );

  const entries = history
    .map(selection => normalizeSelection(selection, mealMap))
    .filter(Boolean)
    .sort((a, b) => b.date - a.date);

  const learningScore = calculateLearningScore(entries, meals);
  const candidates = scoreMeals({ entries, meals, now });

  return {
    learningScore,
    candidates,
    primary: candidates[0] || null
  };
}

function scoreMeals({ entries, meals, now }) {
  const stats = buildMealStats(entries);
  const currentHour = now.getHours();
  const currentDay = now.getDay();

  return meals
    .map(meal => {
      const mealId = String(meal.id);
      const stat = stats.get(mealId) || {
        count: 0,
        lastDate: null,
        hours: [],
        weekdays: []
      };

      const daysSince = stat.lastDate
        ? Math.max(
            0,
            Math.floor(
              (startOfDay(now) - startOfDay(stat.lastDate)) /
              86400000
            )
          )
        : 999;

      const favoriteBonus = meal.favorite ? 18 : 0;
      const noveltyBonus = stat.count === 0 ? 30 : Math.min(daysSince, 30) * 1.5;
      const familiarityBonus = Math.min(stat.count, 8) * 2.5;
      const hourBonus = getHourAffinity(stat.hours, currentHour);
      const weekdayBonus = stat.weekdays.includes(currentDay) ? 7 : 0;
      const repetitionPenalty = daysSince <= 1 ? 45 : daysSince <= 3 ? 22 : 0;

      const score =
        noveltyBonus +
        familiarityBonus +
        favoriteBonus +
        hourBonus +
        weekdayBonus -
        repetitionPenalty;

      return {
        meal,
        score,
        confidence: Math.max(35, Math.min(96, Math.round(45 + score / 2.2))),
        reason: buildReason({
          meal,
          stat,
          daysSince,
          hourBonus,
          weekdayBonus
        })
      };
    })
    .sort((a, b) => b.score - a.score);
}

function buildMealStats(entries) {
  const stats = new Map();

  entries.forEach(entry => {
    const current = stats.get(entry.mealId) || {
      count: 0,
      lastDate: null,
      hours: [],
      weekdays: []
    };

    current.count += 1;
    current.hours.push(entry.date.getHours());
    current.weekdays.push(entry.date.getDay());

    if (!current.lastDate || entry.date > current.lastDate) {
      current.lastDate = entry.date;
    }

    stats.set(entry.mealId, current);
  });

  return stats;
}

function getHourAffinity(hours, currentHour) {
  if (!hours.length) return 0;

  const closeMatches = hours.filter(hour =>
    Math.abs(hour - currentHour) <= 2
  ).length;

  return Math.min(16, closeMatches * 4);
}

function buildReason({
  meal,
  stat,
  daysSince,
  hourBonus,
  weekdayBonus
}) {
  if (stat.count === 0) {
    return '✨ עדיין לא בחרתם אותה — אולי הגיע הזמן לנסות משהו חדש';
  }

  if (meal.favorite && daysSince >= 7) {
    return `❤️ מועדפת שלא הופיעה כבר ${daysSince} ימים`;
  }

  if (daysSince >= 14) {
    return `📅 עברו כבר ${daysSince} ימים מאז שבחרתם אותה`;
  }

  if (hourBonus >= 8) {
    return '🕒 לפי ההיסטוריה שלכם, היא מתאימה לשעה הזאת';
  }

  if (weekdayBonus > 0) {
    return '📆 בימים כאלה אתם נוטים לבחור בה';
  }

  if (meal.favorite) {
    return '❤️ אחת המנות האהובות שלכם';
  }

  return '🧠 נבחרה לפי האיזון בין גיוון, היסטוריה והעדפות';
}

function calculateLearningScore(entries, meals) {
  if (!entries.length) return 0;

  const uniqueMeals = new Set(entries.map(entry => entry.mealId)).size;
  const historyScore = Math.min(55, entries.length * 2.2);
  const varietyScore = meals.length
    ? Math.min(30, (uniqueMeals / meals.length) * 30)
    : 0;
  const consistencyScore = Math.min(
    15,
    new Set(entries.map(entry => toDayKey(entry.date))).size * 1.5
  );

  return Math.round(
    Math.min(100, historyScore + varietyScore + consistencyScore)
  );
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

  if (!mealId || !date || !mealMap.has(mealId)) return null;

  return {
    mealId,
    meal: mealMap.get(mealId),
    date
  };
}

function parseDate(value) {
  if (!value) return null;

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  const direct = new Date(value);
  if (!Number.isNaN(direct.getTime())) return direct;

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

function toDayKey(date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}
