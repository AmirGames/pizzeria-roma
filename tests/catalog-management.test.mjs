import test from 'node:test';
import assert from 'node:assert/strict';
import { validateCatalogEdit, isSameOriginMutation, parseEuroCents } from '../src/lib/catalog-management.mjs';
import { quotePizza } from '../src/lib/pizza-quote.mjs';

const product = { id: 'pizza', active: true, category: { fulfillmentCategory: 'PIZZA' }, sizes: [{ id: 's33', active: true, priceCents: 1000 }, { id: 's50', active: true, priceCents: 2000 }], extras: [{ id: 'cheese', active: true, priceCents: 100, sizePrices: { s33: 150, s50: 300 } }], removableIngredients: ['Tomate'] };
const input = () => ({ revision: 0, nameFr: 'Pizza Roma', active: true, baseCents: 0, removableIngredients: ['Tomate'], sizes: [{ id: 's33', priceCents: 1000, active: true }, { id: 's50', priceCents: 2000, active: true }], extras: [{ id: 'cheese', nameFr: 'Fromage', active: true, priceCents: 100, sizePrices: { s33: 150, s50: 300 } }] });

test('uses the selected format price and never discounts ingredient removals', () => {
  assert.equal(quotePizza(product, { sizeId: 's33', extraIds: ['cheese'], removedIngredients: ['Tomate'] }).unitCents, 1150);
  assert.equal(quotePizza(product, { sizeId: 's50', extraIds: ['cheese'] }).unitCents, 2300);
  const restricted = { ...product, extras: [{ ...product.extras[0], sizePrices: { s33: 150 } }] };
  assert.throws(() => quotePizza(restricted, { sizeId: 's50', extraIds: ['cheese'] }), /INVALID_EXTRAS/);
  assert.equal(quotePizza({ ...product, extras: [{ ...product.extras[0], sizePrices: null }] }, { sizeId: 's50', extraIds: ['cheese'] }).unitCents, 2100);
});

test('validates edits and rejects option IDs belonging to another product', () => {
  assert.deepEqual(validateCatalogEdit(input(), product), input());
  for (const change of [
    { role: 'MANAGER' }, { active: 'true' }, { baseCents: -1 }, { revision: 0.5 },
    { removableIngredients: ['Tomate', 'Tomate'] }, { removableIngredients: [''] },
    { sizes: [{ id: 'foreign', priceCents: 1000, active: true }, input().sizes[1]] },
    { sizes: input().sizes.map(size => ({ ...size, active: false })) },
    { extras: [{ ...input().extras[0], id: 'foreign' }] },
    { extras: [{ ...input().extras[0], sizePrices: { foreign: 300 } }] },
    { extras: [{ ...input().extras[0], sizePrices: {} }] },
    { extras: [{ ...input().extras[0], sizePrices: { s33: -1 } }] },
  ]) assert.throws(() => validateCatalogEdit({ ...input(), ...change }, product), /INVALID_CATALOG_EDIT/);
  const pasta = { ...product, category: { fulfillmentCategory: 'PASTA' } };
  assert.throws(() => validateCatalogEdit(input(), pasta), /INVALID_CATALOG_EDIT/);
});

test('requires JSON same-origin mutations, rejects cross-site and missing origin', () => {
  const make = headers => new Request('https://roma.example/api/manager/products/pizza', { method: 'PATCH', headers });
  assert.equal(isSameOriginMutation(make({ origin: 'https://roma.example', 'content-type': 'application/json' })), true);
  for (const headers of [{}, { origin: 'https://evil.example', 'content-type': 'application/json' }, { origin: 'https://roma.example', 'content-type': 'text/plain' }, { origin: 'https://roma.example', 'content-type': 'application/json', 'sec-fetch-site': 'cross-site' }]) assert.equal(isSameOriginMutation(make(headers)), false);
  assert.equal(isSameOriginMutation(make({ origin: 'https://public.example', 'content-type': 'application/json' }), 'https://public.example'), true);
});

test('parses euro amounts exactly and rejects ambiguous or overflowing prices', () => {
  assert.equal(parseEuroCents('1,50'), 150);
  assert.equal(parseEuroCents('3.5'), 350);
  assert.equal(parseEuroCents('0'), 0);
  for (const amount of ['-1', '1.234', '1e2', 'NaN', '', '1 000', '99999999']) assert.throws(() => parseEuroCents(amount));
});
