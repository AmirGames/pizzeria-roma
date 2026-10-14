import test from 'node:test';
import assert from 'node:assert/strict';
import { priceItem } from '../src/lib/menu-pricing.mjs';

test('calculates base, size, extras and quantity in cents', () => {
  assert.deepEqual(priceItem({ baseCents: 1100, sizeSurchargeCents: 700, extras: [150, 200], quantity: 2 }), { unitCents: 2150, totalCents: 4300, quantity: 2 });
});
test('no floating point cents and invalid input', () => {
  assert.throws(() => priceItem({ baseCents: 10.5 }), RangeError);
  assert.throws(() => priceItem({ baseCents: -1 }), RangeError);
  assert.throws(() => priceItem({ baseCents: 100, quantity: 0 }), RangeError);
  assert.throws(() => priceItem({ baseCents: 100, extras: [-1] }), RangeError);
  assert.throws(() => priceItem({ baseCents: Number.MAX_SAFE_INTEGER, quantity: 2 }), RangeError);
});
test('base price cannot be overridden by client-provided totals', () => {
  const input = { baseCents: 1200, totalCents: 1 };
  assert.equal(priceItem(input).totalCents, 1200);
});
