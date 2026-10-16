export function calculateLoyaltyReward(products, items, completedPaidDishCount, reservedFreeDishCount) {
  if (!Array.isArray(products) || !Array.isArray(items) || !Number.isSafeInteger(completedPaidDishCount) || !Number.isSafeInteger(reservedFreeDishCount)) throw new Error('INVALID_LOYALTY_STATE');
  const productById = new Map(products.map(product => [product.id, product]));
  const eligibleUnitPrices = [];
  for (const [lineIndex, item] of items.entries()) {
    const product = productById.get(item.productId);
    if (!product || !['PIZZA', 'PASTA'].includes(product.category.fulfillmentCategory)) continue;
    for (let index = 0; index < item.quantity; index++) eligibleUnitPrices.push({ lineIndex, priceCents: item.unitCents });
  }
  let paidDishCount = completedPaidDishCount;
  let rewardsUsed = reservedFreeDishCount;
  let freeDishCount = 0;
  for (let index = 0; index < eligibleUnitPrices.length; index++) {
    if (Math.floor(paidDishCount / 10) > rewardsUsed) {
      freeDishCount++;
      rewardsUsed++;
    } else {
      paidDishCount++;
    }
  }
  const freeByLine = Array(items.length).fill(0);
  const freePriceCents = eligibleUnitPrices.sort((a, b) => a.priceCents - b.priceCents).slice(0, freeDishCount).reduce((sum, dish) => {
    freeByLine[dish.lineIndex]++;
    return sum + dish.priceCents;
  }, 0);
  return { loyaltyPaidDishCount: paidDishCount - completedPaidDishCount, loyaltyFreeDishCount: freeDishCount, loyaltyDiscountCents: freePriceCents, loyaltyFreeByLine: freeByLine };
}
