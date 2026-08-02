import assert from 'node:assert/strict';
import { calculateAchievements } from './engine.js';

const meals = [
  { id: 'M1', name: 'פיצה', favorite: true },
  { id: 'M2', name: 'סלט', favorite: false }
];

const history = [
  { MealID: 'M1', MealName: 'פיצה', Date: '2026-08-02T10:00:00+03:00' },
  { MealID: 'M1', MealName: 'פיצה', Date: '2026-08-01T10:00:00+03:00' },
  { MealID: 'M2', MealName: 'סלט', Date: '2026-07-31T10:00:00+03:00' }
];

const achievements = calculateAchievements({ history, meals });

const firstChoice = achievements.find(item => item.id === 'first-choice');
assert.equal(firstChoice.unlocked, true);

const streak = achievements.find(item => item.id === 'steady-couple');
assert.equal(streak.progress >= 3, true);

const favorites = achievements.find(item => item.id === 'favorites-fan');
assert.equal(favorites.progress, 2);

console.log('Achievements tests: OK');
