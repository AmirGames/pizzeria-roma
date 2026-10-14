/**
 * Validate selection IDs against a trusted server-side product catalog.
 * Prices never come from the submitted selection.
 */
export function resolvePizzaSelection(product, selection) {
  if (!product || !product.active || !Array.isArray(product.sizes) || !Array.isArray(product.extras)) {
    throw new Error('PRODUCT_UNAVAILABLE');
  }
  if (!selection || typeof selection !== 'object' || Array.isArray(selection)) {
    throw new Error('INVALID_SELECTION');
  }
  const size = product.sizes.find(item => item.id === selection.sizeId && item.active);
  if (!size) throw new Error('INVALID_SIZE');
  const ids = selection.extraIds ?? [];
  if (!Array.isArray(ids) || ids.length > 20 || new Set(ids).size !== ids.length || !ids.every(id => typeof id === 'string')) {
    throw new Error('INVALID_EXTRAS');
  }
  const extras = ids.map(id => {
    const extra = product.extras.find(item => item.id === id && item.active);
    if (!extra) throw new Error('INVALID_EXTRAS');
    return extra;
  });
  const removedIngredients = selection.removedIngredients ?? [];
  if (!Array.isArray(removedIngredients) || removedIngredients.length > 30 ||
      new Set(removedIngredients).size !== removedIngredients.length ||
      !removedIngredients.every(id => typeof id === 'string' && product.removableIngredients?.includes(id))) {
    throw new Error('INVALID_REMOVALS');
  }
  return { size, extras, removedIngredients };
}
