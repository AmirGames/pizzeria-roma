import { priceItem } from './menu-pricing.mjs';
import { resolvePizzaSelection } from './pizza-options.mjs';

/**
 * Only pass a product record loaded from the database on the server.
 * A browser request must contain IDs and quantity, never prices.
 */
export function quotePizza(product, selection) {
  const resolved = resolvePizzaSelection(product, selection);
  const quote = priceItem({
    baseCents: resolved.size.priceCents,
    extras: resolved.extras.map(extra => extra.priceCents),
    quantity: selection.quantity ?? 1,
  });
  return {
    productId: product.id,
    sizeId: resolved.size.id,
    extraIds: resolved.extras.map(extra => extra.id),
    removedIngredients: resolved.removedIngredients,
    ...quote,
  };
}
