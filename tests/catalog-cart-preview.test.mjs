import test from 'node:test';
import assert from 'node:assert/strict';
import { previewCatalogCart } from '../src/lib/catalog-cart-preview.mjs';

const catalog = [
  {
    id: 'pizza-margherita', nameFr: 'Margherita', active: true, baseCents: 0,
    category: { fulfillmentCategory: 'PIZZA' },
    sizes: [{ id: 's33', label: '33 cm', priceCents: 1200, active: true }, { id: 's50', label: '50 cm', priceCents: 1700, active: true }],
    extras: [{ id: 'extra-cheese', priceCents: 200, active: true }, { id: 'extra-basil', priceCents: 400, active: true }],
  },
  {
    id: 'pasta-roma', nameFr: 'Pâtes Roma', active: true, baseCents: 1400,
    category: { fulfillmentCategory: 'PASTA' }, sizes: [],
    extras: [{ id: 'extra-cheese', priceCents: 200, active: true }],
  },
  {
    id: 'tiramisu', nameFr: 'Tiramisu', active: true, baseCents: 650,
    category: { fulfillmentCategory: 'OTHER' }, sizes: [], extras: [],
  },
];

test('prices pizza from trusted size and extras, then applies per-unit delivery threshold', () => {
  const result = previewCatalogCart(catalog, [
    { productId: 'pizza-margherita', sizeId: 's33', extraIds: ['extra-cheese'], quantity: 1 },
  ], { mode: 'delivery', zoneId: 'belgrade' });
  assert.equal(result.items[0].unitCents, 1400);
  assert.equal(result.subtotalCents, 1400);
  assert.deepEqual(result.fulfillment, { eligible: false, minimum: 2, dishCount: 1, deliveryFeeCents: 0 });
  const atThreshold = previewCatalogCart(catalog, [{ productId: 'pizza-margherita', sizeId: 's33', extraIds: ['extra-cheese', 'extra-basil'], quantity: 1 }], { mode: 'delivery', zoneId: 'belgrade' });
  assert.equal(atThreshold.items[0].unitCents, 1800);
  assert.equal(atThreshold.fulfillment.dishCount, 2);
  assert.equal(atThreshold.fulfillment.eligible, true);
});

test('maxi, pasta and dessert use their existing dish rules', () => {
  const result = previewCatalogCart(catalog, [
    { productId: 'pizza-margherita', sizeId: 's50', quantity: 1 },
    { productId: 'pasta-roma', quantity: 1 },
    { productId: 'tiramisu', quantity: 2 },
  ], { mode: 'delivery', zoneId: 'erpent' });
  assert.equal(result.subtotalCents, 4400);
  assert.deepEqual(result.fulfillment, { eligible: true, minimum: 2, dishCount: 3, deliveryFeeCents: 0 });
  const onlyDesserts = previewCatalogCart(catalog, [{ productId: 'tiramisu', quantity: 2 }], { mode: 'delivery', zoneId: 'namur-centre' });
  assert.equal(onlyDesserts.fulfillment.dishCount, 0);
  assert.equal(onlyDesserts.fulfillment.eligible, false);
});

test('pickup has no delivery minimum and the browser cannot supply authoritative price or category', () => {
  const result = previewCatalogCart(catalog, [{ productId: 'pasta-roma', quantity: 1 }], { mode: 'pickup' });
  assert.equal(result.fulfillment.eligible, true);
  assert.equal(result.fulfillment.minimum, 0);
  assert.equal(result.items[0].unitCents, 1400);
  assert.throws(() => previewCatalogCart(catalog, [{ productId: 'pasta-roma', unitCents: 1, quantity: 1 }], { mode: 'pickup' }), /INVALID_CART/);
  assert.throws(() => previewCatalogCart(catalog, [{ productId: 'pasta-roma', category: 'PIZZA', quantity: 1 }], { mode: 'pickup' }), /INVALID_CART/);
});

test('rejects invalid selections, unavailable products, prices and delivery inputs', () => {
  assert.throws(() => previewCatalogCart(catalog, [{ productId: 'missing', quantity: 1 }], { mode: 'pickup' }), /PRODUCT_UNAVAILABLE/);
  assert.throws(() => previewCatalogCart(catalog, [{ productId: 'pizza-margherita', sizeId: 's33', quantity: 1, extraIds: ['missing'] }], { mode: 'pickup' }), /INVALID_EXTRAS/);
  assert.throws(() => previewCatalogCart(catalog, [{ productId: 'pizza-margherita', sizeId: 's50', quantity: 1 }], { mode: 'delivery', zoneId: 'unknown' }), /UNKNOWN_ZONE/);
  assert.throws(() => previewCatalogCart(catalog, [{ productId: 'pasta-roma', quantity: 100 }], { mode: 'pickup' }), /INVALID_CART/);
  assert.throws(() => previewCatalogCart([{ ...catalog[1], baseCents: -2 }], [{ productId: 'pasta-roma', quantity: 1 }], { mode: 'pickup' }), /Invalid price/);
});
