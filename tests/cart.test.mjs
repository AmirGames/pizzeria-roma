import test from 'node:test';
import assert from 'node:assert/strict';
import { addCartItem, cartTotal, setCartQuantity } from '../src/lib/cart.mjs';
const pizza = { key: 'pizza', unitCents: 1099, quantity: 1 };
test('adds and merges matching items', () => {
  const items = addCartItem(addCartItem([], pizza), pizza);
  assert.equal(items.length, 1);
  assert.equal(items[0].quantity, 2);
  assert.equal(cartTotal(items), 2198);
});
test('changes quantity and removes items', () => {
  assert.equal(cartTotal(setCartQuantity([pizza], 'pizza', 3)), 3297);
  assert.deepEqual(setCartQuantity([pizza], 'pizza', 0), []);
});
test('rejects negative prices, invalid quantity and overflow', () => {
  assert.throws(() => cartTotal([{ ...pizza, unitCents: -1 }]), /Invalid/);
  assert.throws(() => setCartQuantity([pizza], 'pizza', 100), /Invalid/);
  assert.throws(() => cartTotal([{ ...pizza, unitCents: Number.MAX_SAFE_INTEGER, quantity: 2 }]), /overflow/);
});
