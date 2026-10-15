import test from 'node:test';
import assert from 'node:assert/strict';
import { validatePizzaCreation } from '../src/lib/pizza-creation.mjs';
const input = { categoryId: 'pizzas', nameFr: 'Nouvelle pizza', price33Cents: 1200, removableIngredients: ['Tomate'] };
test('creates only a draft, with explicit formats and no inferred ingredients or prices', () => {
  const draft = validatePizzaCreation(input);
  assert.equal(draft.active, false);
  assert.deepEqual(draft.sizes.create, [{ label: '33 cm', priceCents: 1200 }]);
  assert.deepEqual(draft.removableIngredients, ['Tomate']);
  assert.deepEqual(validatePizzaCreation({ ...input, price50Cents: 2500 }).sizes.create[1], { label: '50 cm', priceCents: 2500 });
});
test('rejects publication fields, arbitrary ids, invalid prices and duplicate removals', () => {
  for (const changes of [{ active: true }, { id: 'forced' }, { role: 'MANAGER' }, { nameFr: '' }, { price33Cents: -1 }, { price33Cents: 12.5 }, { price50Cents: null }, { removableIngredients: ['Tomate', 'Tomate'] }, { removableIngredients: [''] }]) {
    assert.throws(() => validatePizzaCreation({ ...input, ...changes }), /INVALID_PIZZA/);
  }
});
