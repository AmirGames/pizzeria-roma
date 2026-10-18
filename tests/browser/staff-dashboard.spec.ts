import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { createSessionToken } from '../../src/lib/session-token.mjs';
import { brusselsDayWindow } from '../../src/lib/staff-dashboard.mjs';
const prisma = new PrismaClient();
let userIds: string[] = [];
test.afterEach(async () => { await prisma.user.deleteMany({ where: { id: { in: userIds } } }); userIds = []; });
test.afterAll(async () => prisma.$disconnect());
test('a manager follows dashboard counters and sees the Brussels daily summary refresh', async ({ page }) => {
  if (process.env.RUN_DATABASE_TESTS !== '1' || !new URL(process.env.DATABASE_URL!).pathname.endsWith('_test')) throw new Error('Dedicated test database required');
  const suffix = randomUUID(); const session = createSessionToken();
  const manager = await prisma.user.create({ data: { email: `dashboard-staff-${suffix}@example.test`, role: 'MANAGER', sessions: { create: { tokenHash: session.tokenHash, expiresAt: new Date(Date.now() + 600000) } } } });
  userIds.push(manager.id);
  const owner = await prisma.user.create({ data: { email: `dashboard-owner-${suffix}@example.test` } });
  userIds.push(owner.id);
  await page.context().addCookies([{ name: 'roma_session', value: session.token, url: 'http://localhost:3200', httpOnly: true, sameSite: 'Lax' }]);
  const day = brusselsDayWindow();
  const specs = [
    { status: 'PENDING', fulfillment: 'PICKUP', time: day.start.getTime() - 1 },
    { status: 'PENDING', fulfillment: 'PICKUP', time: day.start.getTime() },
    { status: 'READY', fulfillment: 'DELIVERY', time: day.start.getTime() + 1 },
    { status: 'PREPARING', fulfillment: 'PICKUP', time: day.end.getTime() - 1 },
    { status: 'CANCELLED', fulfillment: 'PICKUP', time: day.start.getTime() + 2 },
    { status: 'REJECTED', fulfillment: 'DELIVERY', time: day.start.getTime() + 3 },
    { status: 'COMPLETED', fulfillment: 'PICKUP', time: day.start.getTime() + 4 },
    { status: 'ACCEPTED', fulfillment: 'DELIVERY', time: day.end.getTime() },
    { status: 'OUT_FOR_DELIVERY', fulfillment: 'DELIVERY', time: day.start.getTime() + 5 },
  ] as const;
  const rows = specs.map((spec, i) => ({ id: `dashboard-${suffix}-${i}`, publicReference: `TEST-DASH-${suffix}-${i}`, userId: owner.id, requestKey: randomUUID(), requestHash: '0'.repeat(64), fulfillment: spec.fulfillment, contactName: 'Client fictif dashboard', phone: '081 00 00 00', status: spec.status, totalCents: 1200, itemsSnapshot: [{ productId: 'dashboard-fixture-product', label: 'Pizza tableau', quantity: 1, extraIds: [], extraLabels: [], removedIngredients: [], unitCents: 1200, totalCents: 1200 }], placedAt: new Date(spec.time) }));
  await prisma.testOrder.createMany({ data: rows });
  await page.goto('/gerant');
  const counters = page.getByRole('navigation', { name: 'Compteurs des commandes de test', exact: true });
  const counter = (label: string) => counters.getByRole('link', { name: new RegExp(`^${label}`) });
  await expect(counter('À traiter').locator('p')).toHaveText('6');
  await expect(counter('À accepter').locator('p')).toHaveText('2');
  await expect(counter('En préparation').locator('p')).toHaveText('1');
  await expect(counter('Prêts').locator('p')).toHaveText('1');
  const today = page.locator('section[aria-labelledby="dashboard-today-title"]');
  const daily = (label: string) => today.locator('dl > div').filter({ has: page.getByText(label, { exact: true }) }).locator('dd');
  await expect(today).toContainText(day.date.split('-').reverse().join('/'));
  await expect(daily('Essais enregistrés')).toHaveText('7');
  await expect(daily('Retraits simulés')).toHaveText('4');
  await expect(daily('Livraisons simulées')).toHaveText('3');
  await expect(daily('Actuellement annulés ou refusés')).toHaveText('2');
  await counter('En préparation').click();
  const queue = page.getByRole('region', { name: 'File des essais', exact: true });
  await expect(queue.getByLabel('Statut des essais', { exact: true })).toHaveValue('PREPARING');
  await expect(queue.getByRole('article')).toHaveCount(1);
  await queue.getByRole('article').getByRole('button', { name: 'Test prêt', exact: true }).click();
  await expect(queue.getByRole('article')).toHaveCount(0);
  await page.getByRole('link', { name: 'Tableau de bord', exact: true }).click();
  await expect(counter('En préparation').locator('p')).toHaveText('0');
  await expect(counter('Prêts').locator('p')).toHaveText('2');
  await counter('Prêts').click();
  await expect(queue.getByRole('article')).toHaveCount(2);
  await page.getByRole('link', { name: 'Tableau de bord', exact: true }).click();
  await prisma.testOrder.create({ data: { ...rows[1], id: `dashboard-${suffix}-new`, publicReference: `TEST-DASH-${suffix}-NEW`, requestKey: randomUUID(), fulfillment: 'DELIVERY' } });
  await page.getByRole('button', { name: 'Actualiser les essais', exact: true }).click();
  await expect(counter('À traiter').locator('p')).toHaveText('7');
  await expect(counter('À accepter').locator('p')).toHaveText('3');
  await expect(daily('Essais enregistrés')).toHaveText('8');
  await expect(daily('Livraisons simulées')).toHaveText('4');
  expect(await prisma.testOrder.count({ where: { userId: owner.id } })).toBe(10);
});
