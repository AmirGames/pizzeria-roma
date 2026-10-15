/** Initialize an editor from the current public catalogue without retaining retired choices. */
export function initializeCatalogSelection(product, initial) {
  const sizeId = product.sizes.some(size => size.id === initial?.sizeId) ? initial.sizeId : product.sizes[0]?.id;
  const available = id => product.extras.some(extra => extra.id === id && (extra.sizePrices == null || Object.hasOwn(extra.sizePrices, sizeId)));
  let extraIds = (initial?.extraIds ?? []).filter(available);
  if (product.extraSelectionMode === 'SINGLE') extraIds = extraIds.slice(0, 1);
  const removedIngredients = (initial?.removedIngredients ?? []).filter(ingredient => product.removableIngredients?.includes(ingredient));
  const changed = !!initial && (initial.sizeId !== sizeId || extraIds.length !== initial.extraIds.length || removedIngredients.length !== (initial.removedIngredients ?? []).length);
  return { sizeId: sizeId ?? '', extraIds, removedIngredients, changed };
}
