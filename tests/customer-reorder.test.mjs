import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareCustomerReorder, appendCustomerReorder } from '../src/lib/customer-reorder.mjs';
import { previewCatalogCart } from '../src/lib/catalog-cart-preview.mjs';
const pizza = { id: 'pizza', nameFr: 'Pizza actuelle', active: true, baseCents: 0, removableIngredients: ['Tomate'], category: { fulfillmentCategory: 'PIZZA' }, sizes: [{ id: 'small', label: '33 cm', active: true, priceCents: 1300 }], extras: [{ id: 'cheese', nameFr: 'Chèvre', priceCents: 200, active: true }] };
const selection = { productId: 'pizza', sizeId: 'small', extraIds: ['cheese'], removedIngredients: ['Tomate'], quantity: 2 };
const old = { ...selection, label: 'Ancien nom', sizeLabel: '33 cm', extraLabels: ['Ancien supplément'], unitCents: 1, totalCents: 2 };
test('reorders exact identifiers and quantities with current labels and prices', () => {
  const prepared = prepareCustomerReorder([pizza], [old]);
  assert.deepEqual(prepared.items, [selection]);
  assert.equal(prepared.preview.subtotalCents, 3000);
  assert.equal(prepared.preview.items[0].label, 'Pizza actuelle');
  assert.deepEqual(prepared.preview.items[0].extraLabels, ['Chèvre']);
  assert.equal(prepared.preview.items[0].sizeId, 'small');
  assert.equal(previewCatalogCart([pizza], [selection], { mode: 'pickup' }).items[0].sizeId, 'small');
});
test('legacy snapshots need an unambiguous active size label and never override an explicit size identifier', () => {
  const { sizeId, ...legacy } = old;
  assert.equal(prepareCustomerReorder([pizza], [legacy]).items[0].sizeId, 'small');
  assert.throws(() => prepareCustomerReorder([{ ...pizza, sizes: [...pizza.sizes, { ...pizza.sizes[0], id: 'duplicate' }] }], [legacy]), /REORDER_UNAVAILABLE/);
  assert.throws(() => prepareCustomerReorder([pizza], [{ ...legacy, sizeLabel: '50 cm' }]), /REORDER_UNAVAILABLE/);
  assert.throws(() => prepareCustomerReorder([pizza], [{ ...old, sizeId: 'deleted' }]), /REORDER_UNAVAILABLE/);
  const dessert = { ...pizza, id: 'dessert', category: { fulfillmentCategory: 'OTHER' }, sizes: [], extras: [], baseCents: 600 };
  assert.equal(prepareCustomerReorder([dessert], [{ productId: 'dessert', extraIds: [], removedIngredients: [], quantity: 1 }]).preview.subtotalCents, 600);
});
test('does not drop unavailable products, formats, extras or ingredient removals', () => {
  for (const product of [undefined, { ...pizza, active: false }, { ...pizza, sizes: [{ ...pizza.sizes[0], active: false }] }, { ...pizza, extras: [] }, { ...pizza, extras: [{ ...pizza.extras[0], active: false }] }, { ...pizza, removableIngredients: [] }]) assert.throws(() => prepareCustomerReorder(product ? [product] : [], [old]), /REORDER_UNAVAILABLE/);
  for (const snapshot of [null, [], [null], [{ ...old, quantity: undefined }], [{ ...old, quantity: 0 }], [{ ...old, extraIds: undefined }], [{ ...old, removedIngredients: undefined }], Array(31).fill(old)]) assert.throws(() => prepareCustomerReorder([pizza], snapshot), /REORDER_UNAVAILABLE/);
});
test('merges into a fresh cart without changing its existing articles and fails atomically on limits', () => {
  const existing = { productId: 'drink', extraIds: [], quantity: 3 };
  const raw = JSON.stringify([existing, { ...selection, quantity: 1 }]);
  const result = appendCustomerReorder(raw, [selection]);
  assert.deepEqual(result[0], existing);
  assert.equal(result[1].quantity, 3);
  assert.equal(JSON.parse(raw)[1].quantity, 1);
  assert.equal(appendCustomerReorder(null, [selection])[0].quantity, 2);
  assert.throws(() => appendCustomerReorder(JSON.stringify([{ ...selection, quantity: 98 }]), [selection]), /INVALID_CART/);
  const full = JSON.stringify(Array.from({ length: 30 }, (_, i) => ({ productId: `other-${i}`, extraIds: [], quantity: 1 })));
  assert.throws(() => appendCustomerReorder(full, [selection]), /INVALID_CART/);
  for (const raw of ['invalid', 'null', '[{}]', '{}']) assert.throws(() => appendCustomerReorder(raw, [selection]), /INVALID_CART/);
});
