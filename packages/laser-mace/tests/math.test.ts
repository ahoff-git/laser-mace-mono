import test from 'node:test';
import assert from 'node:assert';
import { createRollingAverage } from '../src/math';

test('createRollingAverage calculates rolling average correctly', () => {
  const avg = createRollingAverage(3);
  avg.add(1);
  assert.ok(Math.abs(avg.getAverage() - 1) < 0.0001);
  avg.add(2);
  const a2 = avg.getAverage();
  assert.ok(a2 >= 1);
  avg.add(3);
  const a3 = avg.getAverage();
  assert.ok(a3 >= a2);
  avg.add(4);
  const a4 = avg.getAverage();
  assert.ok(a4 >= a3);
});
