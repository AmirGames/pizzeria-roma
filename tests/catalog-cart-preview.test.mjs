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

test('prices exclusive pasta variants and cheese from trusted catalog options', () => {
  const pasta = {
    id: 'pasta-choice', nameFr: 'Bolognese', active: true, baseCents: 1200,
    choiceLabel: 'Type de pâtes', extraSelectionMode: 'SINGLE',
    category: { fulfillmentCategory: 'PASTA' },
    sizes: [
      { id: 'spaghetti', label: 'Spaghetti', priceCents: 1200, active: true },
      { id: 'macaroni', label: 'Macaroni', priceCents: 1200, active: true },
      { id: 'tagliatelle', label: 'Tagliatelle', priceCents: 1300, active: true },
    ],
    extras: [
      { id: 'parmesan', nameFr: 'Parmesan', priceCents: 250, active: true },
      { id: 'gruyere', nameFr: 'Gruyère', priceCents: 250, active: true },
    ],
  };
  const result = previewCatalogCart([pasta], [
    { productId: 'pasta-choice', sizeId: 'tagliatelle', extraIds: ['parmesan'], quantity: 2 },
  ], { mode: 'delivery', zoneId: 'belgrade' });
  assert.equal(result.items[0].sizeLabel, 'Tagliatelle');
  assert.deepEqual(result.items[0].extraLabels, ['Parmesan']);
  assert.equal(result.items[0].unitCents, 1550);
  assert.equal(result.subtotalCents, 3100);
  assert.equal(result.fulfillment.eligible, true);
  assert.equal(result.fulfillment.dishCount, 2);

  assert.throws(() => previewCatalogCart([pasta], [
    { productId: 'pasta-choice', sizeId: 'spaghetti', extraIds: ['parmesan', 'gruyere'], quantity: 1 },
  ], { mode: 'pickup' }), /INVALID_EXTRAS/);
  assert.throws(() => previewCatalogCart([pasta], [
    { productId: 'pasta-choice', quantity: 1 },
  ], { mode: 'pickup' }), /INVALID_SIZE/);
  assert.throws(() => previewCatalogCart([pasta], [
    { productId: 'pasta-choice', sizeId: 'unknown', quantity: 1 },
  ], { mode: 'pickup' }), /INVALID_SIZE/);
});

test('exclusive dessert choice remains OTHER for delivery counting', () => {
  const dessert = {
    id: 'dessert-choice', nameFr: 'Tiramisù ou profiteroles', active: true, baseCents: 500,
    choiceLabel: 'Choix', category: { fulfillmentCategory: 'OTHER' },
    sizes: [{ id: 'profiteroles', label: 'Profiteroles', priceCents: 500, active: true }],
    extras: [],
  };
  const result = previewCatalogCart([dessert], [
    { productId: 'dessert-choice', sizeId: 'profiteroles', quantity: 1 },
  ], { mode: 'delivery', zoneId: 'namur-centre' });
  assert.equal(result.items[0].unitCents, 500);
  assert.equal(result.items[0].sizeLabel, 'Profiteroles');
  assert.equal(result.fulfillment.dishCount, 0);
  assert.equal(result.fulfillment.eligible, false);
});

test('validates recipe removals on server and never discounts the pizza', () => {
  const pizza = { ...catalog[0], removableIngredients: ['Tomate', 'Mozzarella'] };
  const selection = { productId: pizza.id, sizeId: 's33', extraIds: ['extra-cheese'], quantity: 2 };
  const standard = previewCatalogCart([pizza], [selection], { mode: 'pickup' });
  const modified = previewCatalogCart([pizza], [{ ...selection, removedIngredients: ['Tomate'] }], { mode: 'pickup' });
  assert.equal(modified.subtotalCents, standard.subtotalCents);
  assert.deepEqual(modified.items[0].removedIngredients, ['Tomate']);
  for (const removedIngredients of [['unknown'], ['Tomate', 'Tomate'], 'Tomate', [1]]) {
    assert.throws(() => previewCatalogCart([pizza], [{ ...selection, removedIngredients }], { mode: 'pickup' }), /INVALID_REMOVALS/);
  }
  assert.throws(() => previewCatalogCart(catalog, [{ productId: 'pasta-roma', quantity: 1, removedIngredients: ['Tomate'] }], { mode: 'pickup' }), /INVALID_REMOVALS/);
});

test('server preview applies size-specific supplement prices rather than browser amounts', () => {
  const pizza = { ...catalog[0], extras: [{ id: 'cheese', nameFr: 'Fromage', active: true, priceCents: 0, sizePrices: { s33: 150, s50: 300 } }] };
  const selection = { productId: pizza.id, extraIds: ['cheese'], quantity: 2 };
  assert.equal(previewCatalogCart([pizza], [{ ...selection, sizeId: 's33' }], { mode: 'pickup' }).subtotalCents, 2700);
  assert.equal(previewCatalogCart([pizza], [{ ...selection, sizeId: 's50' }], { mode: 'pickup' }).subtotalCents, 4000);
});
