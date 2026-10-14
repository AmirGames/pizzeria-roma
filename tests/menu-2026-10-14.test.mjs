import test from 'node:test';
import assert from 'node:assert/strict';
import { menu20261014 } from '../prisma/menu-2026-10-14.mjs';

const categories = new Map(menu20261014.map(category => [category.fulfillmentCategory === 'PIZZA' ? 'PIZZA' : category.nameFr, category]));
const products = menu20261014.flatMap(category => category.products.map(product => ({ ...product, category })));

test('menu source has unique stable IDs and valid euro-cent prices', () => {
  const ids = [];
  for (const category of menu20261014) {
    ids.push(category.id);
    for (const product of category.products) {
      ids.push(product.id, ...product.sizes.map(item => item.id), ...product.extras.map(item => item.id));
      assert.ok(Number.isSafeInteger(product.baseCents) && product.baseCents >= 0);
      for (const option of [...product.sizes, ...product.extras]) {
        assert.ok(Number.isSafeInteger(option.priceCents) && option.priceCents >= 0);
      }
    }
  }
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(products.length, 89);
});

test('pizza prices match the 14 October 2026 menu, with no invented Calzone maxi or add-ons', () => {
  const pizzas = products.filter(product => product.category.fulfillmentCategory === 'PIZZA');
  assert.equal(pizzas.length, 43);
  const calzone = pizzas.find(product => product.nameFr === 'Calzone');
  assert.deepEqual(calzone.sizes.map(item => [item.label, item.priceCents]), [['33 cm', 1400]]);
  const margherita = pizzas.find(product => product.nameFr === 'Margherita');
  assert.deepEqual(margherita.sizes.map(item => item.priceCents), [1000, 2250]);
  assert.equal(pizzas.find(product => product.nameFr === 'Burrata Pesto').sizes[0].priceCents, 1850);
  assert.ok(pizzas.every(product => product.extras.length === 0));
  assert.ok(!pizzas.some(product => product.nameFr === 'Mortadella'));
});

test('pasta shape and cheese choices are server-priced and exclusive', () => {
  const pasta = products.filter(product => product.category.fulfillmentCategory === 'PASTA');
  assert.equal(pasta.length, 20);
  const selectable = pasta.filter(product => product.choiceLabel === 'Type de pâtes');
  assert.equal(selectable.length, 14);
  for (const product of selectable) {
    const prices = Object.fromEntries(product.sizes.map(option => [option.label, option.priceCents]));
    assert.equal(prices.Spaghetti, product.baseCents);
    assert.equal(prices.Macaroni, product.baseCents);
    assert.equal(prices.Tagliatelle, product.baseCents + 100);
  }
  for (const product of pasta) {
    assert.equal(product.extraSelectionMode, 'SINGLE');
    assert.deepEqual(product.extras.map(item => [item.nameFr, item.priceCents]), [['Parmesan', 250], ['Gruyère', 250]]);
  }
});

test('non-main dishes remain OTHER and desserts keep the existing delivery classification', () => {
  for (const category of menu20261014.filter(item => !['Pizzas', 'Pâtes'].includes(item.nameFr))) {
    assert.equal(category.fulfillmentCategory, 'OTHER');
  }
  const desserts = categories.get('Desserts');
  assert.deepEqual(desserts.products.map(product => product.baseCents), [500, 500]);
});
