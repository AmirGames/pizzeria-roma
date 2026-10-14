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
    { category: 'pizza', quantity: 1 },
    { category: 'pasta', quantity: 1 },
    { category: 'other', quantity: 5 },
  ]);
  assert.equal(dishes, 2);
  assert.equal(evaluateDelivery({ mode: 'delivery', zoneId: 'erpent', mainDishCount: dishes }).eligible, true);
  assert.equal(countEligibleDishes([{ category: 'other', quantity: 3 }]), 0);
  assert.throws(() => countEligibleDishes([{ category: 'unknown', quantity: 1 }]), /INVALID_CATEGORY/);
});
