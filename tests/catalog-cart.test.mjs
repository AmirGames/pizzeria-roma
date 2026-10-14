import test from 'node:test';
import assert from 'node:assert/strict';
import { addCatalogCartItem, readCatalogCart, setCatalogCartQuantity } from '../src/lib/catalog-cart.mjs';

test('stores only product, size, extra identifiers and quantity', () => {
  const lines = addCatalogCartItem([], { productId: 'pizza', sizeId: '33', extraIds: ['cheese'], quantity: 1 });
  assert.deepEqual(lines, [{ productId: 'pizza', sizeId: '33', extraIds: ['cheese'], quantity: 1 }]);
  assert.deepEqual(readCatalogCart(JSON.stringify(lines)), lines);
});

test('merges equivalent selections and keeps different options separate', () => {
  let lines = addCatalogCartItem([], { productId: 'pizza', sizeId: '33', extraIds: ['b', 'a'] });
  lines = addCatalogCartItem(lines, { productId: 'pizza', sizeId: '33', extraIds: ['a', 'b'] });
  lines = addCatalogCartItem(lines, { productId: 'pizza', sizeId: '50', extraIds: ['a', 'b'] });
  assert.deepEqual(lines.map(line => line.quantity), [2, 1]);
  assert.deepEqual(setCatalogCartQuantity(lines, 0, 0), [lines[1]]);
});

test('rejects price/category fields and malformed selections from browser storage', () => {
  assert.deepEqual(readCatalogCart(JSON.stringify([{ productId: 'pizza', unitCents: 1, quantity: 1 }])), []);
  assert.deepEqual(readCatalogCart(JSON.stringify([{ productId: 'pizza', quantity: 0 }])), []);
  assert.deepEqual(readCatalogCart(JSON.stringify([{ productId: 'pizza', quantity: 1, extraIds: ['x', 'x'] }])), []);
  assert.throws(() => addCatalogCartItem([], { productId: 'pizza', quantity: 100 }), /INVALID_CART/);
});
