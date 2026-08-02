import assert from 'node:assert/strict';
import { buildTimelineEntries } from './engine.js';
import { groupTimelineEntries } from './grouping.js';

const meals = [
  { id: 'M1', name: 'פיצה', image: 'pizza.jpg', emoji: '🍕', favorite: true },
  { id: 'M2', name: 'סלט', image: 'salad.jpg', emoji: '🥗' }
];

const history = [
  { SelectionID: 'S1', MealID: 'M1', MealName: 'פיצה', User: 'מעיין', Date: '2026-08-02T20:00:00+03:00' },
  { SelectionID: 'S2', MealID: 'M2', MealName: 'סלט', User: 'מעיין', Date: '2026-08-01T19:00:00+03:00' }
];

const entries = buildTimelineEntries({ history, meals });
assert.equal(entries.length, 2);
assert.equal(entries[0].name, 'פיצה');
assert.equal(entries[0].favorite, true);
assert.equal(groupTimelineEntries(entries).length, 2);
console.log('Timeline tests: OK');
