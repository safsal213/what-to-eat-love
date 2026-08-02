import assert from 'node:assert/strict';
import { pickRediscoverMeal } from './engine.js';

const candidate = pickRediscoverMeal({
  meals: [
    { id: 'M1', name: 'פיצה', favorite: true },
    { id: 'M2', name: 'סלט', favorite: false }
  ],
  history: [
    { MealID: 'M1', Date: '2026-06-01T10:00:00+03:00' },
    { MealID: 'M2', Date: '2026-07-30T10:00:00+03:00' }
  ],
  now: new Date('2026-08-02T12:00:00+03:00')
});

assert.equal(candidate.meal.id, 'M1');
assert.equal(candidate.daysSince > 7, true);
console.log('Rediscover tests: OK');
