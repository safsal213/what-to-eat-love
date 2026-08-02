import assert from 'node:assert/strict';
import { calculateJourney } from './engine.js';

const journey = calculateJourney({
  history: [
    { MealID: 'M1', Date: '2026-08-01T10:00:00+03:00' },
    { MealID: 'M2', Date: '2026-08-02T10:00:00+03:00' }
  ],
  achievements: [
    { unlocked: true },
    { unlocked: false }
  ]
});

assert.equal(journey.meals, 2);
assert.equal(journey.uniqueMeals, 2);
assert.equal(journey.unlockedAchievements, 1);
console.log('Journey tests: OK');
