import test from 'node:test';
import assert from 'node:assert/strict';
import { initializeCatalogSelection } from '../src/lib/catalog-selection.mjs';
const product = { sizes: [{ id: '33' }, { id: '50' }], extras: [{ id: 'small', sizePrices: { '33': 150 } }, { id: 'flat' }], removableIngredients: ['Tomate'], extraSelectionMode: 'MULTIPLE' };
test('preserves valid selections when reopening the editor', () => {
  assert.deepEqual(initializeCatalogSelection(product, { sizeId: '33', extraIds: ['small'], removedIngredients: ['Tomate'] }), { sizeId: '33', extraIds: ['small'], removedIngredients: ['Tomate'], changed: false });
});
test('drops unavailable choices and flags the changed catalogue for explicit confirmation', () => {
  assert.deepEqual(initializeCatalogSelection(product, { sizeId: '50', extraIds: ['small', 'flat'], removedIngredients: ['Retired'] }), { sizeId: '50', extraIds: ['flat'], removedIngredients: [], changed: true });
  assert.equal(initializeCatalogSelection(product, { sizeId: 'retired', extraIds: [] }).sizeId, '33');
  assert.deepEqual(initializeCatalogSelection({ ...product, extraSelectionMode: 'SINGLE' }, { sizeId: '33', extraIds: ['flat', 'small'] }).extraIds, ['flat']);
});
