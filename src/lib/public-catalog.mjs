const allowedCategories = new Set(['PIZZA', 'PASTA', 'OTHER']);

function assertPrice(value) {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error('CATALOG_INVALID');
  return value;
}

/** Return only active, presentation-safe fields from trusted catalog records. */
export function buildPublicCatalog(categories) {
  if (!Array.isArray(categories)) throw new Error('CATALOG_INVALID');
  return categories
    .filter(category => category && typeof category.id === 'string' && typeof category.nameFr === 'string' && Number.isSafeInteger(category.position) && allowedCategories.has(category.fulfillmentCategory))
    .map(category => ({
      id: category.id,
      nameFr: category.nameFr,
      position: category.position,
      products: (Array.isArray(category.products) ? category.products : [])
        .filter(product => product && product.active === true && typeof product.id === 'string' && typeof product.nameFr === 'string')
        .map(product => {
          if (product.choiceLabel !== undefined && product.choiceLabel !== null &&
              (typeof product.choiceLabel !== 'string' || !product.choiceLabel.trim())) throw new Error('CATALOG_INVALID');
          if (product.extraSelectionMode !== undefined && !['SINGLE', 'MULTIPLE'].includes(product.extraSelectionMode)) throw new Error('CATALOG_INVALID');
          return {
          id: product.id,
          nameFr: product.nameFr,
          baseCents: assertPrice(product.baseCents),
          choiceLabel: typeof product.choiceLabel === 'string' && product.choiceLabel.trim() ? product.choiceLabel : null,
          extraSelectionMode: product.extraSelectionMode === 'SINGLE' ? 'SINGLE' : 'MULTIPLE',
          sizes: (Array.isArray(product.sizes) ? product.sizes : []).filter(size => size && size.active === true).map(size => ({ id: size.id, label: size.label, priceCents: assertPrice(size.priceCents) })),
          extras: (Array.isArray(product.extras) ? product.extras : []).filter(extra => extra && extra.active === true).map(extra => ({ id: extra.id, nameFr: extra.nameFr, priceCents: assertPrice(extra.priceCents) })),
        }).sort((a, b) => a.nameFr.localeCompare(b.nameFr, 'fr')),
    }))
    .filter(category => category.products.length > 0)
    .sort((a, b) => a.position - b.position || a.nameFr.localeCompare(b.nameFr, 'fr'));
}
