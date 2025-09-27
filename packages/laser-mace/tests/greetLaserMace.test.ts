import test from 'node:test';
import assert from 'node:assert';
import { greetLaserMace } from '../src/test';

test('greetLaserMace returns the greeting string', () => {
  assert.strictEqual(greetLaserMace(), 'Hello from LaserMace!');
});
