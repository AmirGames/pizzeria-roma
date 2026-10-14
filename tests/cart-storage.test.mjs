import test from 'node:test';
import assert from 'node:assert/strict';
import { readCart } from '../src/lib/cart-storage.mjs';

const pizza = { key: 'demo-pizza', label: 'Pizza fictive', details: '33 cm', unitCents: 1000, quantity: 2, category: 'pizza', sizeCm: '33' };

test('restores valid cart lines with delivery metadata', () => {
  assert.deepEqual(readCart(JSON.stringify([pizza])), [pizza]);
});
test('rejects malformed, priced incorrectly, and unsupported cart data', () => {
  assert.deepEqual(readCart('{broken'), []);
  assert.deepEqual(readCart(JSON.stringify([{ ...pizza, unitCents: 1.5 }])), []);
  assert.deepEqual(readCart(JSON.stringify([{ ...pizza, sizeCm: '50cm' }])), []);
  assert.deepEqual(readCart(JSON.stringify([{ ...pizza, quantity: 0 }])), []);
  assert.deepEqual(readCart(JSON.stringify({ ...pizza })), []);
  assert.deepEqual(readCart(null), []);
});
