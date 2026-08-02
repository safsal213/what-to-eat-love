/**
 * Achievement definitions.
 * Add a new achievement by adding one object to this array.
 */
export const ACHIEVEMENT_DEFINITIONS = Object.freeze([
  {
    id: 'first-choice',
    icon: '🌟',
    title: 'הבחירה הראשונה',
    description: 'בחרתם את הארוחה הראשונה שלכם',
    type: 'total_selections',
    goal: 1
  },
  {
    id: 'meal-explorer',
    icon: '🌍',
    title: 'אוהבי גיוון',
    description: 'נסו 10 מנות שונות',
    type: 'unique_meals',
    goal: 10
  },
  {
    id: 'meal-explorer-pro',
    icon: '🗺️',
    title: 'חוקרי טעמים',
    description: 'נסו 20 מנות שונות',
    type: 'unique_meals',
    goal: 20
  },
  {
    id: 'favorites-fan',
    icon: '❤️',
    title: 'נאמנים למועדפים',
    description: 'בחרו 10 פעמים מנה מועדפת',
    type: 'favorite_selections',
    goal: 10
  },
  {
    id: 'favorites-master',
    icon: '💖',
    title: 'לבבות מנצחים',
    description: 'בחרו 25 פעמים מנה מועדפת',
    type: 'favorite_selections',
    goal: 25
  },
  {
    id: 'steady-couple',
    icon: '🔥',
    title: 'רצף מושלם',
    description: 'בחרו ארוחה 7 ימים ברצף',
    type: 'daily_streak',
    goal: 7
  },
  {
    id: 'thirty-choices',
    icon: '🍽️',
    title: 'שלושים בחירות',
    description: 'הגיעו ל־30 בחירות',
    type: 'total_selections',
    goal: 30
  },
  {
    id: 'hundred-choices',
    icon: '💯',
    title: 'מאה ארוחות ביחד',
    description: 'הגיעו ל־100 בחירות',
    type: 'total_selections',
    goal: 100
  },
  {
    id: 'top-meal-ten',
    icon: '🏆',
    title: 'מנה אגדית',
    description: 'אותה מנה נבחרה 10 פעמים',
    type: 'top_meal_count',
    goal: 10
  }
]);
