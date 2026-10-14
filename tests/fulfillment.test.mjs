import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateDelivery, isWithinService, minimumMainDishes, serviceWindows, countEligibleDishes } from '../src/lib/fulfillment.mjs';

test('delivery is free and requires main dishes by zone', () => {
  assert.deepEqual(evaluateDelivery({ mode: 'delivery', zoneId: 'erpent', mainDishCount: 2 }), { eligible: true, minimum: 2, deliveryFeeCents: 0 });
  assert.equal(evaluateDelivery({ mode: 'delivery', zoneId: 'erpent', mainDishCount: 1 }).eligible, false);
  assert.equal(minimumMainDishes('namur-centre'), 1);
  assert.equal(minimumMainDishes('belgrade'), 2);
  assert.equal(minimumMainDishes('erpent'), 2);
  assert.equal(minimumMainDishes('saint-servais'), 2);
});
test('pickup does not require delivery minimums', () => {
  assert.deepEqual(evaluateDelivery({ mode: 'pickup', mainDishCount: 0 }), { eligible: true, minimum: 0, deliveryFeeCents: 0 });
});
test('unknown zones and invalid counts fail closed', () => {
  assert.throws(() => evaluateDelivery({ mode: 'delivery', zoneId: 'unknown', mainDishCount: 10 }), /UNKNOWN_ZONE/);
  assert.throws(() => evaluateDelivery({ mode: 'delivery', zoneId: 'erpent', mainDishCount: -1 }), /INVALID_COUNT/);
});
test('restaurant opening windows', () => {
  assert.deepEqual(serviceWindows(0), []);
  assert.equal(isWithinService(1, '11:30'), true);
  assert.equal(isWithinService(1, '14:00'), false);
  assert.equal(isWithinService(6, '13:00'), false);
  assert.equal(isWithinService(6, '18:00'), true);
  assert.equal(isWithinService(0, '19:00'), false);
});

test('counts only pizzas and pasta, including quantities', () => {
  const dishes = countEligibleDishes([
    { category: 'pizza', sizeCm: '33', unitCents: 1200, quantity: 1 },
    { category: 'pasta', quantity: 1 },
    { category: 'other', quantity: 5 },
  ]);
  assert.equal(dishes, 2);
  assert.equal(evaluateDelivery({ mode: 'delivery', zoneId: 'erpent', mainDishCount: dishes }).eligible, true);
  assert.equal(countEligibleDishes([{ category: 'other', quantity: 3 }]), 0);
  assert.throws(() => countEligibleDishes([{ category: 'unknown', quantity: 1 }]), /INVALID_CATEGORY/);
});

test('a 50 cm maxi pizza counts as two dishes regardless of price', () => {
  assert.equal(countEligibleDishes([{ category: 'pizza', sizeCm: '50', unitCents: 2200, quantity: 1 }]), 2);
  assert.equal(countEligibleDishes([{ category: 'pizza', sizeCm: '50', unitCents: 2200, quantity: 2 }]), 4);
  assert.equal(countEligibleDishes([{ category: 'pizza', sizeCm: '33', unitCents: 1200, quantity: 1 }]), 1);
  assert.equal(countEligibleDishes([
    { category: 'pizza', sizeCm: '50', quantity: 1 },
    { category: 'pasta', quantity: 1 },
    { category: 'other', quantity: 3 },
  ]), 3);
  assert.equal(evaluateDelivery({ mode: 'delivery', zoneId: 'erpent', mainDishCount: 2 }).eligible, true);
  assert.throws(() => countEligibleDishes([{ category: 'pizza', sizeCm: '20', unitCents: 1200, quantity: 1 }]), /INVALID_SIZE/);
  assert.throws(() => countEligibleDishes([{ category: 'pizza', unitCents: 1200, quantity: 1 }]), /INVALID_SIZE/);
});

test('33 cm pizza counts as two at 18 euros including supplements', () => {
  for (const [price, expected] of [[1750, 1], [1799, 1], [1800, 2], [1850, 2], [2000, 2]]) {
    assert.equal(countEligibleDishes([{ category: 'pizza', sizeCm: '33', unitCents: price, quantity: 1 }]), expected);
  }
  assert.equal(countEligibleDishes([
    { category: 'pizza', sizeCm: '33', unitCents: 1200, quantity: 2 },
  ]), 2, 'two inexpensive pizzas count as two, not four');
  assert.equal(countEligibleDishes([
    { category: 'pizza', sizeCm: '33', unitCents: 1800, quantity: 2 },
  ]), 4);
  assert.equal(countEligibleDishes([{ category: 'pizza', sizeCm: '50', unitCents: 1500, quantity: 1 }]), 2);
  assert.throws(() => countEligibleDishes([{ category: 'pizza', sizeCm: '33', unitCents: 1200, quantity: 1 }]), /INVALID_PRICE/);
  assert.throws(() => countEligibleDishes([{ category: 'pizza', sizeCm: '33', unitCents: 18.5, quantity: 1 }]), /INVALID_PRICE/);
});
