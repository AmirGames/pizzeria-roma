import test from 'node:test';
import assert from 'node:assert/strict';
import { quotePizza } from '../src/lib/pizza-quote.mjs';

const product = {
  id: 'pizza-1', active: true,
  sizes: [{ id: '33', active: true, priceCents: 1100 }, { id: '50', active: true, priceCents: 1800 }],
  extras: [{ id: 'cheese', active: true, priceCents: 150 }, { id: 'inactive', active: false, priceCents: 1 }],
  removableIngredients: ['onion'],
};

test('quotes selected size and extras from trusted catalog', () => {
  const quote = quotePizza(product, { sizeId: '50', extraIds: ['cheese'], removedIngredients: ['onion'], quantity: 2, totalCents: 1 });
  assert.equal(quote.unitCents, 1950);
  assert.equal(quote.totalCents, 3900);
  assert.deepEqual(quote.removedIngredients, ['onion']);
});
test('rejects invalid size, duplicate extras and unavailable options', () => {
  assert.throws(() => quotePizza(product, { sizeId: 'unknown' }), /INVALID_SIZE/);
  assert.throws(() => quotePizza(product, { sizeId: '33', extraIds: ['cheese', 'cheese'] }), /INVALID_EXTRAS/);
  assert.throws(() => quotePizza(product, { sizeId: '33', extraIds: ['inactive'] }), /INVALID_EXTRAS/);
  assert.throws(() => quotePizza(product, { sizeId: '33', removedIngredients: ['secret'] }), /INVALID_REMOVALS/);
  assert.throws(() => quotePizza({ ...product, active: false }, { sizeId: '33' }), /PRODUCT_UNAVAILABLE/);
});
