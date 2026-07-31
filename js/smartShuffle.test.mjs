import assert from 'node:assert/strict';
import {
  scoreMeal,
  scoreMeals,
  buildEligiblePool,
  pickWeightedMeal
} from './smartShuffle.js';

const now = new Date('2026-08-01T12:00:00+03:00');

const meals = [
  { id: 'M001', name: 'פנקייק', favorite: true },
  { id: 'M002', name: 'סלט', favorite: false },
  { id: 'M003', name: 'פסטה', favorite: false }
];

const history = [
  {
    MealID: 'M001',
    Date: '2026-08-01T08:00:00+03:00'
  },
  {
    MealID: 'M002',
    Date: '2026-07-28T18:00:00+03:00'
  }
];

const favoriteToday = scoreMeal(meals[0], history, now);
assert.equal(favoriteToday.selectedToday, true);
assert.equal(favoriteToday.score, 1);

const selectedThisWeek = scoreMeal(meals[1], history, now);
assert.equal(selectedThisWeek.selectedThisWeek, true);
assert.equal(selectedThisWeek.score, 70);

const neverSelected = scoreMeal(meals[2], history, now);
assert.equal(neverSelected.score, 112);

const scored = scoreMeals(meals, history, now);
assert.equal(scored[0].meal.id, 'M003');

const pool = buildEligiblePool(scored);
assert.equal(pool.some(item => item.meal.id === 'M001'), false);

const picked = pickWeightedMeal(scored, () => 0);
assert.ok(picked);
assert.equal(picked.meal.id, 'M003');

console.log('Smart Shuffle tests: OK');
