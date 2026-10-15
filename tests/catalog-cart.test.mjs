import test from 'node:test';
import assert from 'node:assert/strict';
import { addCatalogCartItem, readCatalogCart, replaceCatalogCartItem, setCatalogCartQuantity } from '../src/lib/catalog-cart.mjs';

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

test('preserves removals after storage and separates recipes while merging reordered removals', () => {
  const original = { productId: 'pizza', sizeId: '33', extraIds: [] };
  let lines = addCatalogCartItem([], original);
  lines = addCatalogCartItem(lines, { ...original, removedIngredients: ['Mozzarella', 'Tomate'] });
  lines = addCatalogCartItem(lines, { ...original, removedIngredients: ['Tomate', 'Mozzarella'] });
  assert.deepEqual(lines.map(line => line.quantity), [1, 2]);
  assert.deepEqual(readCatalogCart(JSON.stringify(lines)), lines);
  assert.deepEqual(setCatalogCartQuantity(lines, 1, 3)[1].removedIngredients, ['Mozzarella', 'Tomate']);
  assert.throws(() => addCatalogCartItem([], { ...original, removedIngredients: ['Tomate', 'Tomate'] }), /INVALID_CART/);
});


test('editing a recipe keeps quantity, position, removals and storage compatibility', () => {
  const lines = [{ productId: 'pizza', sizeId: '33', extraIds: [], quantity: 2 }, { productId: 'pasta', extraIds: [], quantity: 1 }];
  const next = replaceCatalogCartItem(lines, lines[0], { productId: 'pizza', sizeId: '50', extraIds: ['cheese'], removedIngredients: ['Tomate'] });
  assert.equal(next[0].quantity, 2);
  assert.equal(next[0].sizeId, '50');
  assert.deepEqual(next[0].removedIngredients, ['Tomate']);
  assert.deepEqual(next[1], lines[1]);
  assert.deepEqual(readCatalogCart(JSON.stringify(next)), next);
  assert.equal(lines[0].sizeId, '33');
});

test('editing merges an equivalent recipe and rejects overflow without changing either line', () => {
  const lines = [{ productId: 'pizza', sizeId: '33', extraIds: [], quantity: 2 }, { productId: 'pizza', sizeId: '50', extraIds: [], quantity: 3 }];
  assert.deepEqual(replaceCatalogCartItem(lines, lines[0], { productId: 'pizza', sizeId: '50', extraIds: [] }), [{ ...lines[1], quantity: 5 }]);
  const full = [lines[0], { ...lines[1], quantity: 99 }];
  assert.throws(() => replaceCatalogCartItem(full, full[0], { productId: 'pizza', sizeId: '50', extraIds: [] }), /INVALID_CART/);
  assert.equal(full[0].quantity, 2);
  assert.equal(full[1].quantity, 99);
});

test('an edit cannot overwrite a removed or externally modified cart line', () => {
  const original = { productId: 'pizza', sizeId: '33', extraIds: [], quantity: 2 };
  const choice = { productId: 'pizza', sizeId: '50', extraIds: [] };
  assert.throws(() => replaceCatalogCartItem([], original, choice), /CART_CHANGED/);
  assert.throws(() => replaceCatalogCartItem([{ ...original, quantity: 3 }], original, choice), /CART_CHANGED/);
  assert.throws(() => replaceCatalogCartItem([original], original, { ...choice, productId: 'other' }), /INVALID_CART/);
  assert.throws(() => replaceCatalogCartItem([original], original, { ...choice, unitCents: 1 }), /INVALID_CART/);
});
