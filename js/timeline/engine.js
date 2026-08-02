import {
  parseTimelineDate,
  formatTimelineLabel,
  formatTimelineTime,
  formatTimelineFullDate
} from './formatter.js';

export function buildTimelineEntries({ history = [], meals = [] }) {
  const mealMap = new Map(meals.map(meal => [String(meal.id), meal]));

  return history
    .map(selection => {
      const mealId = String(
        selection?.MealID ?? selection?.mealId ?? selection?.id ?? ''
      ).trim();

      const date = parseTimelineDate(
        selection?.Date ??
        selection?.SelectedAt ??
        selection?.selectedAt ??
        selection?.CreatedAt
      );

      if (!date) return null;

      const meal = mealMap.get(mealId) || {};

      return {
        id: selection?.SelectionID || `${mealId}-${date.getTime()}`,
        mealId,
        meal,
        name: selection?.MealName || selection?.mealName || meal.name || 'מנה שנבחרה',
        image: meal.image || '',
        emoji: meal.emoji || '🍽️',
        description: meal.description || '',
        favorite: Boolean(meal.favorite),
        selectedBy: selection?.User || selection?.selectedBy || 'מעיין',
        status: selection?.Status || selection?.status || '',
        date,
        groupLabel: formatTimelineLabel(date),
        timeLabel: formatTimelineTime(date),
        fullDateLabel: formatTimelineFullDate(date)
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.date - a.date);
}
