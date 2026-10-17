import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { setTimeout } from 'node:timers/promises';
import { PrismaClient } from '@prisma/client';
import { createSessionToken } from '../../src/lib/session-token.mjs';
import { nextTestSlot } from './test-slots.mjs';

test('reordering protects ownership and reconstructs current selections without mutating history', { skip: process.env.RUN_DATABASE_TESTS !== '1', timeout: 120000 }, async () => {
  assert.match(new URL(process.env.DATABASE_URL).pathname, /_test$/);
  const prisma = new PrismaClient();
  const origin = 'http://localhost:3160';
  const servers = [3160, 3170].map(port => spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-p', String(port)], { env: { ...process.env, APP_ORIGIN: `http://localhost:${port}`, ENABLE_TEST_ORDERS: port === 3160 ? 'true' : 'false' }, stdio: 'ignore' }));
  const users = [];
  let categoryId;
  const createUser = async (role = 'CUSTOMER') => {
    const session = createSessionToken();
    const user = await prisma.user.create({ data: { email: `reorder-${randomUUID()}@example.test`, role, sessions: { create: { tokenHash: session.tokenHash, expiresAt: new Date(Date.now() + 600000) } } } });
    users.push(user.id); return { id: user.id, cookie: `roma_session=${session.token}` };
  };
  const request = (path, body = {}, cookie, requestOrigin = origin) => fetch(origin + path, { method: 'POST', headers: { origin: requestOrigin, 'content-type': 'application/json', ...(cookie ? { cookie } : {}) }, body: JSON.stringify(body) });
  try {
    for (const port of [3160, 3170]) {
      let ready = false;
      for (let i = 0; i < 100; i++) { try { if ((await fetch(`http://localhost:${port}/compte`)).ok) { ready = true; break; } } catch { /* starting */ } await setTimeout(200); }
      assert.equal(ready, true);
    }
    const owner = await createUser(); const other = await createUser(); const staff = await createUser('MANAGER');
    const category = await prisma.menuCategory.create({ data: { nameFr: 'Reprise CI', nameEn: 'Reorder CI', fulfillmentCategory: 'PIZZA', products: { create: { nameFr: 'Pizza reprise', nameEn: 'Reorder pizza', baseCents: 0, removableIngredients: ['Tomate'], sizes: { create: { label: '33 cm', priceCents: 1200 } }, extras: { create: { nameFr: 'Chèvre', nameEn: 'Cheese', priceCents: 150 } } } } }, include: { products: { include: { sizes: true, extras: true } } } });
    categoryId = category.id;
    const product = category.products[0]; const size = product.sizes[0]; const extra = product.extras[0];
    const body = { items: [{ productId: product.id, sizeId: size.id, extraIds: [extra.id], removedIngredients: ['Tomate'], quantity: 2 }], mode: 'pickup', scheduledFor: await nextTestSlot(prisma, { pizzaCount: 2 }), contactName: 'Client fictif', phone: '081 00 00 00', comment: 'Ancien commentaire fictif', requestKey: randomUUID(), expectedTotalCents: 2700 };
    const creation = await request('/api/test-orders', body, owner.cookie);
    assert.equal(creation.status, 201);
    const { id } = await creation.json(); const path = `/api/test-orders/${id}/reorder`;
    const original = await prisma.testOrder.findUniqueOrThrow({ where: { id } });
    assert.equal(original.itemsSnapshot[0].sizeId, size.id);
    assert.equal((await request(path)).status, 401);
    assert.equal((await request(path, {}, staff.cookie)).status, 401);
    assert.equal((await request(path, {}, other.cookie)).status, 404);
    assert.equal((await request(path, {}, owner.cookie, 'https://evil.test')).status, 403);
    assert.equal((await request(path, { userId: other.id }, owner.cookie)).status, 400);
    assert.equal((await fetch(origin + path)).status, 405);
    assert.equal((await fetch(`http://localhost:3170${path}`, { method: 'POST' })).status, 404);
    await prisma.productSize.update({ where: { id: size.id }, data: { priceCents: 1400 } });
    const response = await request(path, {}, owner.cookie);
    assert.equal(response.status, 200); assert.equal(response.headers.get('cache-control'), 'no-store');
    const prepared = await response.json();
    assert.deepEqual(prepared.items, body.items);
    assert.equal(prepared.previousTotalCents, 2700);
    assert.equal(prepared.preview.subtotalCents, 3100);
    assert.equal(Object.hasOwn(prepared, 'phone'), false);
    assert.deepEqual(await (await request(path, {}, owner.cookie)).json(), prepared);
    assert.equal(await prisma.testOrder.count({ where: { userId: owner.id } }), 1);
    assert.deepEqual((await prisma.testOrder.findUniqueOrThrow({ where: { id } })).itemsSnapshot, original.itemsSnapshot);
    // Existing snapshots did not include sizeId; recover only an exact unique label.
    const legacy = original.itemsSnapshot.map(({ sizeId, ...line }) => line);
    await prisma.testOrder.update({ where: { id }, data: { itemsSnapshot: legacy, status: 'CANCELLED' } });
    assert.equal((await request(path, {}, owner.cookie)).status, 200);
    assert.equal((await request('/api/test-orders', { ...body, requestKey: randomUUID() }, owner.cookie)).status, 409);
    const fresh = await request('/api/test-orders', { ...body, requestKey: randomUUID(), expectedTotalCents: 3100 }, owner.cookie);
    assert.equal(fresh.status, 201); assert.notEqual((await fresh.json()).id, id);
    assert.equal((await prisma.testOrder.findUniqueOrThrow({ where: { id } })).status, 'CANCELLED');
    await prisma.product.update({ where: { id: product.id }, data: { active: false } });
    assert.equal((await request(path, {}, owner.cookie)).status, 409);
    await prisma.product.update({ where: { id: product.id }, data: { active: true } });
    await prisma.productExtra.update({ where: { id: extra.id }, data: { active: false } });
    assert.equal((await request(path, {}, owner.cookie)).status, 409);
    await prisma.productExtra.update({ where: { id: extra.id }, data: { active: true } });
    await prisma.productSize.update({ where: { id: size.id }, data: { active: false } });
    assert.equal((await request(path, {}, owner.cookie)).status, 409);
    await prisma.productSize.update({ where: { id: size.id }, data: { active: true } });
    await prisma.product.update({ where: { id: product.id }, data: { removableIngredients: [] } });
    assert.equal((await request(path, {}, owner.cookie)).status, 409);
  } finally {
    servers.forEach(server => server.kill('SIGTERM'));
    await prisma.user.deleteMany({ where: { id: { in: users } } });
    if (categoryId) { await prisma.product.deleteMany({ where: { categoryId } }); await prisma.menuCategory.deleteMany({ where: { id: categoryId } }); }
    await prisma.$disconnect();
  }
});
