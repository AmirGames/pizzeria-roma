import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateDelivery, isWithinService, minimumMainDishes, serviceWindows } from '../src/lib/fulfillment.mjs';

test('delivery is free and requires main dishes by zone', () => {
  assert.deepEqual(evaluateDelivery({ mode: 'delivery', zoneId: 'erpent', mainDishCount: 2 }), { eligible: false, minimum: 3, deliveryFeeCents: 0 });
  assert.equal(evaluateDelivery({ mode: 'delivery', zoneId: 'erpent', mainDishCount: 3 }).eligible, true);
  assert.equal(minimumMainDishes('namur-centre'), 1);
  assert.equal(minimumMainDishes('belgrade'), 2);
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
