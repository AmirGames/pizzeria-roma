import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPublicCatalog } from '../src/lib/public-catalog.mjs';
const source = [
 { id: 'desserts', nameFr: 'Desserts', fulfillmentCategory: 'OTHER', position: 5, products: [{ id: 'inactive', nameFr: 'Caché', active: false, baseCents: 100, sizes: [], extras: [] }, { id: 'tiramisu', nameFr: 'Tiramisu', active: true, baseCents: 650, sizes: [], extras: [] }] },
 { id: 'pizzas', nameFr: 'Pizzas', fulfillmentCategory: 'PIZZA', position: 1, products: [{ id: 'pizza', nameFr: 'Roma', active: true, baseCents: 0, sizes: [{ id: 'large', label: '50 cm', priceCents: 1900, active: true }, { id: 'old', label: '33 cm', priceCents: 1500, active: false }], extras: [{ id: 'cheese', nameFr: 'Fromage', priceCents: 200, active: true }, { id: 'hidden', nameFr: 'Caché', priceCents: 500, active: false }] }] },
];
test('publishes only active products, sizes and extras using trusted catalog prices', () => { assert.deepEqual(buildPublicCatalog(source), [
 { id: 'pizzas', nameFr: 'Pizzas', position: 1, products: [{ id: 'pizza', nameFr: 'Roma', baseCents: 0, choiceLabel: null, extraSelectionMode: 'MULTIPLE', sizes: [{ id: 'large', label: '50 cm', priceCents: 1900 }], extras: [{ id: 'cheese', nameFr: 'Fromage', priceCents: 200 }] }] },
 { id: 'desserts', nameFr: 'Desserts', position: 5, products: [{ id: 'tiramisu', nameFr: 'Tiramisu', baseCents: 650, choiceLabel: null, extraSelectionMode: 'MULTIPLE', sizes: [], extras: [] }] },
]); });
test('omits empty or unclassified categories and fulfillment metadata', () => { assert.deepEqual(buildPublicCatalog([{ id: 'empty', nameFr: 'Vide', fulfillmentCategory: 'OTHER', position: 0, products: [] }, { id: 'unknown', nameFr: 'Inconnue', fulfillmentCategory: 'UNKNOWN', position: 1, products: [{ id: 'x', nameFr: 'X', active: true, baseCents: 1 }] }]), []); });
test('rejects invalid server prices instead of publishing them', () => { assert.throws(() => buildPublicCatalog([{ id: 'p', nameFr: 'Pizzas', fulfillmentCategory: 'PIZZA', position: 0, products: [{ id: 'x', nameFr: 'X', active: true, baseCents: -1 }] }]), /CATALOG_INVALID/); });

test('publishes trusted exclusive choice metadata for pasta variants', () => {
  const [category] = buildPublicCatalog([{
    id: 'pasta', nameFr: 'Pâtes', fulfillmentCategory: 'PASTA', position: 2,
    products: [{
      id: 'pasta-choice', nameFr: 'Napoli', active: true, baseCents: 1200,
      choiceLabel: 'Type de pâtes', extraSelectionMode: 'SINGLE',
      sizes: [{ id: 'tagliatelle', label: 'Tagliatelle', priceCents: 1300, active: true }],
      extras: [{ id: 'parmesan', nameFr: 'Parmesan', priceCents: 250, active: true }],
    }],
  }]);
  assert.deepEqual(category.products[0], {
    id: 'pasta-choice', nameFr: 'Napoli', baseCents: 1200,
    choiceLabel: 'Type de pâtes', extraSelectionMode: 'SINGLE',
    sizes: [{ id: 'tagliatelle', label: 'Tagliatelle', priceCents: 1300 }],
    extras: [{ id: 'parmesan', nameFr: 'Parmesan', priceCents: 250 }],
  });
});
