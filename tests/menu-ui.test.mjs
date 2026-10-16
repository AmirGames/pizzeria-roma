import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const page = readFileSync(new URL('../src/app/menu/page.tsx', import.meta.url), 'utf8');
test('menu uses live categories without inventing product prices', () => {
  assert.match(page, /CatalogProducts/);
  assert.doesNotMatch(page, /menu-category-index/);
  assert.match(page, /prix et allergènes seront publiés après validation/);
  assert.match(page, /aucune commande ni paiement disponible/);
});
