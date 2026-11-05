import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getDayPart, effectiveDayPart, parseAppearancePreference, nextAppearancePreference,
} from '../src/lib/appearanceTime.ts';

function atHour(hour) { const d = new Date('2026-11-05T00:00:00'); d.setHours(hour); return d; }

test('Morning 06:00–11:59', () => {
  assert.equal(getDayPart(atHour(6)), 'morning');
  assert.equal(getDayPart(atHour(11)), 'morning');
});
test('Afternoon 12:00–17:59', () => {
  assert.equal(getDayPart(atHour(12)), 'afternoon');
  assert.equal(getDayPart(atHour(17)), 'afternoon');
});
test('Night 18:00–05:59 crosses midnight', () => {
  assert.equal(getDayPart(atHour(18)), 'night');
  assert.equal(getDayPart(atHour(23)), 'night');
  assert.equal(getDayPart(atHour(0)), 'night');
  assert.equal(getDayPart(atHour(5)), 'night');
});
test('Manual mode always wins; invalid preference falls back to auto', () => {
  assert.equal(effectiveDayPart('light', 'night'), 'morning');
  assert.equal(effectiveDayPart('dark', 'morning'), 'night');
  assert.equal(effectiveDayPart('auto', 'afternoon'), 'afternoon');
  assert.equal(parseAppearancePreference('bad'), 'auto');
  assert.equal(parseAppearancePreference(null), 'auto');
});
test('Cycle auto → dark → light → auto', () => {
  assert.equal(nextAppearancePreference('auto'), 'dark');
  assert.equal(nextAppearancePreference('dark'), 'light');
  assert.equal(nextAppearancePreference('light'), 'auto');
});
