import { priceItem } from './menu-pricing.mjs';
import { quotePizza } from './pizza-quote.mjs';
import { evaluateCartFulfillment } from './fulfillment.mjs';

const MAX_CART_LINES = 30;
const MAX_EXTRAS_PER_LINE = 20;
const selectionKeys = new Set(['productId', 'sizeId', 'extraIds', 'removedIngredients', 'quantity']);

function validateSelection(selection) {
  if (!selection || typeof selection !== 'object' || Array.isArray(selection) ||
      Object.keys(selection).some(key => !selectionKeys.has(key)) ||
      typeof selection.productId !== 'string' || !selection.productId || selection.productId.length > 128 ||
      !Number.isSafeInteger(selection.quantity) || selection.quantity < 1 || selection.quantity > 99) {
    throw new Error('INVALID_CART');
  }
  const extraIds = selection.extraIds ?? [];
  if (!Array.isArray(extraIds) || extraIds.length > MAX_EXTRAS_PER_LINE ||
      new Set(extraIds).size !== extraIds.length ||
      !extraIds.every(id => typeof id === 'string' && id.length > 0 && id.length <= 128)) {
    throw new Error('INVALID_EXTRAS');
  }
  const removedIngredients = selection.removedIngredients ?? [];
  if (!Array.isArray(removedIngredients) || removedIngredients.length > 30 || new Set(removedIngredients).size !== removedIngredients.length ||
      !removedIngredients.every(id => typeof id === 'string' && id.length > 0 && id.length <= 128)) throw new Error('INVALID_REMOVALS');
  return { ...selection, extraIds, removedIngredients };
}

function validateExtras(product, extraIds) {
  if (!Array.isArray(product.extras)) throw new Error('CATALOG_INVALID');
  const mode = product.extraSelectionMode ?? 'MULTIPLE';
  if (!['SINGLE', 'MULTIPLE'].includes(mode)) throw new Error('CATALOG_INVALID');
  if (mode === 'SINGLE' && extraIds.length > 1) throw new Error('INVALID_EXTRAS');
  return extraIds.map(id => {
    const extra = product.extras.find(item => item.id === id && item.active);
    if (!extra) throw new Error('INVALID_EXTRAS');
    return extra;
  });
}

function sizeClass(product, sizeId) {
  if (!Array.isArray(product.sizes)) throw new Error('CATALOG_INVALID');
  const size = product.sizes.find(item => item.id === sizeId && item.active);
  if (!size) throw new Error('INVALID_SIZE');
  const match = /^(33|50)\s*(?:cm)?$/i.exec(size.label.trim());
  if (!match) throw new Error('INVALID_SIZE');
  return { size, sizeCm: match[1] };
}

/**
 * Build a read-only cart preview from active, trusted database records.
 * Selection input contains identifiers and quantities only, never prices/category.
 */
export function previewCatalogCart(products, rawSelections, fulfillment) {
  if (!Array.isArray(products) || !Array.isArray(rawSelections) ||
      rawSelections.length < 1 || rawSelections.length > MAX_CART_LINES) {
    throw new Error('INVALID_CART');
  }
  const selections = rawSelections.map(validateSelection);
  const productById = new Map(products.map(product => [product.id, product]));
  const lines = [];
  const fulfillmentLines = [];
  let subtotalCents = 0;

  for (const selection of selections) {
    const product = productById.get(selection.productId);
    if (!product || !product.active || !product.category ||
        !['PIZZA', 'PASTA', 'OTHER'].includes(product.category.fulfillmentCategory)) {
      throw new Error('PRODUCT_UNAVAILABLE');
    }

    const extras = validateExtras(product, selection.extraIds);
    let quoted;
    let sizeLabel;
    let fulfillmentLine;

    if (product.category.fulfillmentCategory === 'PIZZA') {
      if (typeof selection.sizeId !== 'string' || !selection.sizeId || selection.sizeId.length > 128) throw new Error('INVALID_SIZE');
      const { size, sizeCm } = sizeClass(product, selection.sizeId);
      quoted = quotePizza(product, selection);
      sizeLabel = size.label;
      fulfillmentLine = { category: 'pizza', sizeCm, unitCents: quoted.unitCents, quantity: quoted.quantity };
    } else {
      if (selection.removedIngredients.length) throw new Error('INVALID_REMOVALS');
      if (product.choiceLabel !== null && product.choiceLabel !== undefined &&
          (typeof product.choiceLabel !== 'string' || !product.choiceLabel.trim())) throw new Error('CATALOG_INVALID');
      if (product.choiceLabel) {
        if (typeof selection.sizeId !== 'string' || !selection.sizeId || selection.sizeId.length > 128 || !Array.isArray(product.sizes)) {
          throw new Error('INVALID_SIZE');
        }
        const option = product.sizes.find(item => item.id === selection.sizeId && item.active);
        if (!option) throw new Error('INVALID_SIZE');
        quoted = priceItem({
          baseCents: option.priceCents,
          extras: extras.map(extra => extra.priceCents),
          quantity: selection.quantity,
        });
        sizeLabel = option.label;
      } else {
        if (selection.sizeId !== undefined) throw new Error('INVALID_SIZE');
        if (Array.isArray(product.sizes) && product.sizes.some(option => option && option.active)) throw new Error('CATALOG_INVALID');
        quoted = priceItem({
          baseCents: product.baseCents,
          extras: extras.map(extra => extra.priceCents),
          quantity: selection.quantity,
        });
      }
      fulfillmentLine = {
        category: product.category.fulfillmentCategory === 'PASTA' ? 'pasta' : 'other',
        quantity: selection.quantity,
      };
    }

    const lineTotalCents = quoted.totalCents;
    if (!Number.isSafeInteger(subtotalCents + lineTotalCents)) throw new Error('PRICE_OVERFLOW');
    subtotalCents += lineTotalCents;
    fulfillmentLines.push(fulfillmentLine);
    lines.push({
      productId: product.id,
      ...(selection.sizeId ? { sizeId: selection.sizeId } : {}),
      label: product.nameFr,
      quantity: quoted.quantity,
      ...(sizeLabel ? { sizeLabel } : {}),
      extraIds: [...selection.extraIds],
      removedIngredients: [...selection.removedIngredients],
      extraLabels: extras.map(extra => typeof extra.nameFr === 'string' ? extra.nameFr : 'Supplément'),
      unitCents: quoted.unitCents,
      totalCents: lineTotalCents,
    });
  }

  const policy = evaluateCartFulfillment({ ...fulfillment, items: fulfillmentLines });

  return {
    items: lines,
    subtotalCents,
    pizzaCount: fulfillmentLines.reduce((count, line) => count + (line.category === 'pizza' ? line.quantity : 0), 0),
    fulfillment: {
      eligible: policy.eligible,
      minimum: policy.minimum,
      dishCount: policy.dishCount,
      deliveryFeeCents: policy.deliveryFeeCents,
    },
  };
}
