import test from 'node:test';
import assert from 'node:assert/strict';
import { validateTestOrder, nextTestStatuses } from '../src/lib/test-order-policy.mjs';
import { consumeCatalogCartItems } from '../src/lib/catalog-cart.mjs';
const input = { items: [{ productId: 'pizza', sizeId: '33', extraIds: [], quantity: 2 }], mode: 'pickup', contactName: 'Test Client', phone: '081 00 00 00', comment: 'test', requestKey: '00000000-0000-0000-0000-000000000000', expectedTotalCents: 2400 };
test('requires explicit contact fields and identifier-only cart', () => {
  assert.equal(validateTestOrder(input).items[0].quantity, 2);
  for (const changes of [{ userId: 'other' }, { totalCents: 1 }, { status: 'COMPLETED' }, { items: [{ ...input.items[0], unitCents: 1 }] }, { phone: 'bad' }, { mode: 'delivery' }, { expectedTotalCents: -1 }]) assert.throws(() => validateTestOrder({ ...input, ...changes }), /INVALID_TEST_ORDER/);
});
test('test statuses follow the allowed workflow and terminal states cannot restart', () => {
  assert.deepEqual(nextTestStatuses('PENDING', 'PICKUP'), ['ACCEPTED', 'REJECTED']);
  assert.deepEqual(nextTestStatuses('READY', 'PICKUP'), ['COMPLETED']);
  assert.deepEqual(nextTestStatuses('READY', 'DELIVERY'), ['OUT_FOR_DELIVERY']);
  for (const state of ['COMPLETED', 'REJECTED', 'CANCELLED', 'unknown']) assert.deepEqual(nextTestStatuses(state, 'PICKUP'), []);
});
test('confirmation consumes only submitted quantities and preserves later additions', () => {
  const original = input.items[0];
  const extra = { productId: 'pasta', extraIds: [], quantity: 1 };
  assert.deepEqual(consumeCatalogCartItems([{ ...original, quantity: 4 }, extra], [original]), [{ ...original, quantity: 2 }, extra]);
  assert.deepEqual(consumeCatalogCartItems([{ ...original, removedIngredients: ['Tomate'] }], [original]), [{ ...original, removedIngredients: ['Tomate'] }]);
  assert.deepEqual(consumeCatalogCartItems([original], [original]), []);
});
