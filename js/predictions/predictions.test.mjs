import assert from 'node:assert/strict';
import { buildPredictions } from './engine.js';

const meals = [
  { id: 'M1', name: 'פיצה', favorite: true },
  { id: 'M2', name: 'סלט', favorite: false },
  { id: 'M3', name: 'פסטה', favorite: false }
];

const history = [
  { MealID: 'M1', Date: '2026-07-10T20:00:00+03:00' },
  { MealID: 'M1', Date: '2026-07-15T20:30:00+03:00' },
  { MealID: 'M2', Date: '2026-08-01T12:00:00+03:00' }
];

const result = buildPredictions({
  history,
  meals,
  now: new Date('2026-08-02T20:00:00+03:00')
});

assert.equal(result.candidates.length, 3);
assert.equal(result.learningScore > 0, true);
assert.equal(Boolean(result.primary?.meal), true);
assert.equal(result.primary.confidence >= 35, true);

console.log('Predictions tests: OK');
