import test from 'node:test';
import assert from 'node:assert';
import { memo, and, or, not, createFSM } from '../src/fsm';

test('basic matching', () => {
  const isAlive = memo((ctx: { hp: number }) => ctx.hp > 0);
  const fsm = createFSM({ statuses: { isAlive } });
  assert.ok(fsm.evaluate({ hp: 10 }).includes('isAlive'));
  assert.ok(!fsm.evaluate({ hp: 0 }).includes('isAlive'));
});

test('composed logic', () => {
  interface SpeakCtx { onGround: boolean; stamina: number; silenced: boolean }
  const grounded = memo((ctx: SpeakCtx) => ctx.onGround);
  const hasStamina = memo((ctx: SpeakCtx) => ctx.stamina > 10);
  const notSilenced = memo((ctx: SpeakCtx) => !ctx.silenced);
  const canSpeak = and(grounded, hasStamina, notSilenced);
  const fsm = createFSM({ statuses: { canSpeak } });
  assert.ok(
    fsm.evaluate({ onGround: true, stamina: 15, silenced: false }).includes('canSpeak')
  );
  assert.ok(
    !fsm.evaluate({ onGround: false, stamina: 15, silenced: false }).includes('canSpeak')
  );
});

test('memo behavior', () => {
  let calls = 0;
  const expensive = memo((ctx: { flag: boolean }) => {
    calls++;
    return ctx.flag;
  });
  const fsm = createFSM({ statuses: { expensive } });
  const ctx = { flag: true };
  fsm.evaluate(ctx, 1);
  fsm.evaluate(ctx, 1);
  assert.strictEqual(calls, 1);
  fsm.evaluate(ctx, 2);
  assert.strictEqual(calls, 2);
});

test('or and not combinators', () => {
  interface FlagCtx { a: boolean; b: boolean }
  const isA = memo((ctx: FlagCtx) => ctx.a);
  const isB = memo((ctx: FlagCtx) => ctx.b);
  const either = or(isA, isB);
  const notA = not(isA);
  const fsm = createFSM({ statuses: { either, notA } });
  const result = fsm.evaluate({ a: false, b: true });
  assert.ok(result.includes('either'));
  assert.ok(result.includes('notA'));
});
