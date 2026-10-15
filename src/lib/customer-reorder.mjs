import { addCatalogCartItem, readCatalogCart } from './catalog-cart.mjs';
import { previewCatalogCart } from './catalog-cart-preview.mjs';

/** Recover selection identifiers only. Never reuse historical prices or silently
 * replace missing options. Legacy snapshots require a unique matching size label. */
export function prepareCustomerReorder(products, snapshot) {
  if (!Array.isArray(snapshot) || !snapshot.length || snapshot.length > 30) throw new Error('REORDER_UNAVAILABLE');
  try {
    const items = snapshot.reduce((items, line) => {
      if (!line || typeof line !== 'object' || !Number.isSafeInteger(line.quantity) || line.quantity < 1 || line.quantity > 99 || !Array.isArray(line.extraIds) || !Array.isArray(line.removedIngredients)) throw new Error();
      const product = products.find(product => product.id === line.productId);
      if (!product?.active) throw new Error();
      let sizeId = line.sizeId;
      if (sizeId === undefined && line.sizeLabel !== undefined) {
        const matches = product.sizes.filter(size => size.active && size.label === line.sizeLabel);
        if (matches.length !== 1) throw new Error();
        sizeId = matches[0].id;
      }
      return addCatalogCartItem(items, { productId: line.productId, quantity: line.quantity, extraIds: line.extraIds, removedIngredients: line.removedIngredients, ...(sizeId !== undefined ? { sizeId } : {}) });
    }, []);
    const preview = previewCatalogCart(products, items, { mode: 'pickup' });
    if (preview.subtotalCents > 2147483647) throw new Error();
    return { items, preview };
  } catch { throw new Error('REORDER_UNAVAILABLE'); }
}

/** Build the complete next cart before writing it: any capacity error leaves the
 * original cart intact. Callers read storage at confirmation time. */
export function appendCustomerReorder(rawCart, selections) {
  const current = readCatalogCart(rawCart);
  if (rawCart !== null) {
    let parsed;
    try { parsed = JSON.parse(rawCart); } catch { throw new Error('INVALID_CART'); }
    if (!Array.isArray(parsed) || parsed.length !== current.length) throw new Error('INVALID_CART');
  }
  if (!Array.isArray(selections) || !selections.length || selections.length > 30) throw new Error('INVALID_CART');
  return selections.reduce((cart, line) => addCatalogCartItem(cart, line), current);
}
