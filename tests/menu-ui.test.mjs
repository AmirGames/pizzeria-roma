import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const page = readFileSync(new URL('../src/app/menu/page.tsx', import.meta.url), 'utf8');
test('menu shows categories without inventing product prices', () => {
  for (const category of ['Pizzas', 'Pâtes', 'Entrées', 'Salades', 'Desserts', 'Boissons']) {
    assert.ok(page.includes(category));
  }
  assert.match(page, /prix et allergènes seront publiés après validation/);
  assert.match(page, /aucune commande ni paiement disponible/);
  assert.match(page, /CatalogProducts/);
  assert.match(page, /CatalogProducts/);
  assert.match(page, /aucune commande ni paiement disponible/);
});
