import test from 'node:test';
import assert from 'node:assert';
import { rng, randomItem, getContrastingColor } from '../src/random';

test('rng generates numbers within range', () => {
  const value = rng(1, 2);
  assert.ok(value >= 1 && value <= 2);
});

test('randomItem returns an item from the array', () => {
  const arr = [1, 2, 3];
  const item = randomItem(arr);
  assert.ok(arr.includes(item));
});

test('getContrastingColor returns black or white', () => {
  assert.strictEqual(getContrastingColor('#FFFFFF'), '#000000');
  assert.strictEqual(getContrastingColor('#000000'), '#FFFFFF');
});
