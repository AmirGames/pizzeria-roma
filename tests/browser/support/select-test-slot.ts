import { expect, type Page } from '@playwright/test';
// @ts-ignore JavaScript module; covered by delivery slot tests
import { listBookableDates } from '../../../src/lib/delivery-slots.mjs';

/** Select the first available day and slot, including Sundays and closed hours. */
export async function selectTestSlot(page: Page, pizzaCount: number, mode: 'pickup' | 'delivery' = 'pickup') {
  const dateSelect = page.getByLabel('Jour souhaité', { exact: true });
  const dates = listBookableDates();
  for (const date of dates) {
    const response = await page.request.get(`/api/customer/delivery-slots?date=${encodeURIComponent(date)}&mode=${mode}&pizzaCount=${pizzaCount}`);
    if (!response.ok()) continue;
    const result = await response.json() as { slots?: Array<{ value: string }> };
    const slot = result.slots?.[0];
    if (!slot) continue;
    await expect.poll(() => dateSelect.locator('option').evaluateAll((options, target) => options.some(option => (option as HTMLOptionElement).value === target), date)).toBe(true);
    await dateSelect.selectOption(date);
    const slotSelect = page.getByLabel('Créneau de 15 minutes', { exact: true });
    await expect.poll(() => slotSelect.locator('option').evaluateAll((options, target) => options.some(option => (option as HTMLOptionElement).value === target), slot.value)).toBe(true);
    await slotSelect.selectOption(slot.value);
    return;
  }
  throw new Error(`No ${mode} slot available for ${pizzaCount} pizza(s)`);
}
