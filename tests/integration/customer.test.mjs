import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { setTimeout } from 'node:timers/promises';
import { PrismaClient } from '@prisma/client';
import { createSessionToken } from '../../src/lib/session-token.mjs';

const enabled = process.env.RUN_DATABASE_TESTS === '1';
test('customer accounts, ownership, idempotent checkout and simulated staff workflow', { skip: !enabled, timeout: 120000 }, async () => {
  assert.match(new URL(process.env.DATABASE_URL).pathname, /_test$/);
  const prisma = new PrismaClient();
  const origin = 'http://localhost:3110';
  const start = (port, flag) => spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-p', String(port)], { env: { ...process.env, APP_ORIGIN: `http://localhost:${port}`, ENABLE_TEST_ORDERS: flag }, stdio: ['ignore', 'ignore', 'ignore'] });
  const server = start(3110, 'true');
  const disabledServer = start(3120, 'false');
  const request = (path, method = 'GET', body, cookie, requestOrigin = origin) => fetch(origin + path, { method, headers: { ...(method !== 'GET' ? { origin: requestOrigin, 'content-type': 'application/json' } : {}), ...(cookie ? { cookie } : {}) }, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
  const password = 'Customer-local-test-password';
  const email = `client-${randomUUID()}@example.test`;
  const otherEmail = `other-${randomUUID()}@example.test`;
  let categoryId, staffId;
  try {
    for (const port of [3110, 3120]) {
      let ready = false;
      for (let attempt = 0; attempt < 100; attempt++) {
        try { if ((await fetch(`http://localhost:${port}/compte`)).ok) { ready = true; break; } } catch { /* starting */ }
        await setTimeout(200);
      }
      assert.equal(ready, true);
    }
    assert.equal((await fetch('http://localhost:3120/api/customer/auth', { method: 'POST' })).status, 404);
    assert.equal((await fetch('http://localhost:3120/api/test-orders', { method: 'POST' })).status, 404);
    assert.equal((await fetch('http://localhost:3120/api/customer/profile', { method: 'PATCH' })).status, 404);
    assert.equal((await fetch('http://localhost:3120/api/customer/password', { method: 'POST' })).status, 404);
    const registration = { action: 'register', email, password, name: 'Client test' };
    assert.equal((await request('/api/customer/auth', 'POST', registration, undefined, 'https://evil.example')).status, 403);
    assert.equal((await request('/api/customer/auth', 'POST', { ...registration, role: 'MANAGER' })).status, 400);
    const registered = await request('/api/customer/auth', 'POST', registration);
    assert.equal(registered.status, 200);
    assert.match(registered.headers.get('set-cookie'), /HttpOnly/i);
    assert.match(registered.headers.get('set-cookie'), /Secure/i);
    const cookie = registered.headers.get('set-cookie').split(';')[0];
    const customer = await prisma.user.findUnique({ where: { email }, include: { customerCredential: true } });
    assert.equal(customer.role, 'CUSTOMER');
    assert.equal(customer.customerCredential.passwordHash.includes(password), false);
    assert.equal((await request('/api/customer/auth', 'POST', { action: 'login', email, password: 'Wrong-local-password' })).status, 401);
    const other = await request('/api/customer/auth', 'POST', { ...registration, email: otherEmail });
    assert.equal(other.status, 200);
    const otherCookie = other.headers.get('set-cookie').split(';')[0];
    const category = await prisma.menuCategory.create({ data: { nameFr: 'CI customer', nameEn: 'CI customer', fulfillmentCategory: 'PIZZA', products: { create: { nameFr: 'CI client pizza', nameEn: 'CI client pizza', baseCents: 0, removableIngredients: ['Tomate'], sizes: { create: [{ label: '33 cm', priceCents: 1200 }, { label: '50 cm', priceCents: 2400 }] } } } }, include: { products: { include: { sizes: true } } } });
    categoryId = category.id;
    const product = category.products[0];
    const small = product.sizes.find(size => size.label === '33 cm');
    const large = product.sizes.find(size => size.label === '50 cm');
    const body = { items: [{ productId: product.id, sizeId: small.id, extraIds: [], removedIngredients: ['Tomate'], quantity: 1 }], mode: 'pickup', contactName: 'Client test', phone: '081 00 00 00', comment: 'Commentaire fictif', requestKey: randomUUID(), expectedTotalCents: 1200 };
    assert.equal((await request('/api/test-orders', 'POST', body)).status, 401);
    assert.equal((await request('/api/test-orders', 'POST', body, cookie, 'https://evil.example')).status, 403);
    assert.equal((await request('/api/test-orders', 'POST', { ...body, userId: 'foreign' }, cookie)).status, 400);
    assert.equal((await request('/api/test-orders', 'POST', { ...body, expectedTotalCents: 1 }, cookie)).status, 409);
    assert.equal((await request('/api/test-orders', 'POST', { ...body, mode: 'delivery', address: 'Rue fictive 1', zoneId: 'belgrade' }, cookie)).status, 400);
    const confirmations = await Promise.all([request('/api/test-orders', 'POST', body, cookie), request('/api/test-orders', 'POST', body, cookie)]);
    assert.deepEqual(confirmations.map(response => response.status).sort(), [200, 201]);
    const orders = await Promise.all(confirmations.map(response => response.json()));
    assert.equal(orders[0].id, orders[1].id);
    const id = orders[0].id;
    assert.equal(await prisma.testOrder.count({ where: { userId: customer.id } }), 1);
    assert.equal(await prisma.order.count({ where: { userId: customer.id } }), 0);
    assert.equal((await request(`/api/test-orders/${id}`, 'GET', undefined, otherCookie)).status, 404);
    assert.equal((await request(`/compte/commandes/${id}`, 'GET', undefined, otherCookie)).status, 404);
    assert.equal((await request(`/api/test-orders/${id}/status`, 'PATCH', { status: 'ACCEPTED', revision: 0 }, cookie)).status, 403);
    assert.equal((await request('/api/test-orders', 'POST', { ...body, comment: 'different' }, cookie)).status, 409);
    await prisma.productSize.update({ where: { id: small.id }, data: { priceCents: 1400 } });
    const detail = await (await request(`/api/test-orders/${id}`, 'GET', undefined, cookie)).json();
    assert.equal(detail.order.totalCents, 1200);
    assert.deepEqual(detail.order.itemsSnapshot[0].removedIngredients, ['Tomate']);
    assert.equal(detail.order.comment, 'Commentaire fictif');
    // Idempotent retries return the recorded test even when catalogue prices have changed.
    assert.equal((await request('/api/test-orders', 'POST', body, cookie)).status, 200);
    staffId = (await prisma.user.create({ data: { email: `staff-${randomUUID()}@example.test`, role: 'MANAGER' } })).id;
    const staffSession = createSessionToken();
    await prisma.session.create({ data: { userId: staffId, tokenHash: staffSession.tokenHash, expiresAt: new Date(Date.now() + 60000) } });
    const staffCookie = `roma_session=${staffSession.token}`;
    assert.equal((await request(`/api/test-orders/${id}/status`, 'PATCH', { status: 'COMPLETED', revision: 0 }, staffCookie)).status, 400);
    for (const [revision, status] of ['ACCEPTED', 'PREPARING', 'READY', 'COMPLETED'].entries()) {
      assert.equal((await request(`/api/test-orders/${id}/status`, 'PATCH', { status, revision }, staffCookie)).status, 200);
    }
    assert.equal((await request(`/api/test-orders/${id}`, 'PATCH', { revision: 4 }, cookie)).status, 409);
    assert.equal((await (await request(`/api/test-orders/${id}`, 'GET', undefined, cookie)).json()).order.status, 'COMPLETED');
    const delivery = await request('/api/test-orders', 'POST', { ...body, requestKey: randomUUID(), mode: 'delivery', zoneId: 'belgrade', address: 'Rue fictive 1', items: [{ productId: product.id, sizeId: large.id, extraIds: [], quantity: 1 }], expectedTotalCents: 2400 }, cookie);
    assert.equal(delivery.status, 201);
    const deliveryId = (await delivery.json()).id;
    assert.equal((await request(`/api/test-orders/${deliveryId}`, 'PATCH', { revision: 0 }, otherCookie)).status, 409);
    assert.equal((await request(`/api/test-orders/${deliveryId}`, 'PATCH', { revision: 0 }, cookie)).status, 200);
    assert.equal((await request('/api/customer/session', 'DELETE', undefined, cookie)).status, 200);
    assert.equal((await request(`/api/test-orders/${id}`, 'GET', undefined, cookie)).status, 401);
    const loggedIn = await request('/api/customer/auth', 'POST', { action: 'login', email, password });
    assert.equal(loggedIn.status, 200);
    const newCookie = loggedIn.headers.get('set-cookie').split(';')[0];
    const profile = { name: 'Client modifié', phone: '081 11 11 11' };
    assert.equal((await request('/api/customer/profile', 'PATCH', profile)).status, 401);
    assert.equal((await request('/api/customer/profile', 'PATCH', profile, newCookie, 'https://evil.example')).status, 403);
    assert.equal((await request('/api/customer/profile', 'PATCH', { ...profile, userId: 'other' }, newCookie)).status, 400);
    assert.equal((await request('/api/customer/profile', 'PATCH', { ...profile, role: 'MANAGER' }, newCookie)).status, 400);
    assert.equal((await request('/api/customer/profile', 'PATCH', profile, newCookie)).status, 200);
    const updatedProfile = await prisma.user.findUnique({ where: { id: customer.id } });
    assert.equal(updatedProfile.name, profile.name);
    assert.equal(updatedProfile.phone, profile.phone);
    assert.notEqual((await prisma.user.findUnique({ where: { email: otherEmail } })).name, profile.name);
    assert.equal((await (await request(`/api/test-orders/${id}`, 'GET', undefined, newCookie)).json()).order.contactName, 'Client test');
    const secondLogin = await request('/api/customer/auth', 'POST', { action: 'login', email, password });
    assert.equal(secondLogin.status, 200);
    const secondCookie = secondLogin.headers.get('set-cookie').split(';')[0];
    const nextPassword = 'New-customer-local-password';
    const passwordInput = { currentPassword: password, newPassword: nextPassword, confirmation: nextPassword };
    assert.equal((await request('/api/customer/password', 'POST', passwordInput)).status, 401);
    assert.equal((await request('/api/customer/password', 'POST', passwordInput, newCookie, 'https://evil.example')).status, 403);
    assert.equal((await request('/api/customer/password', 'POST', { ...passwordInput, currentPassword: 'Wrong-local-password' }, newCookie)).status, 400);
    const [changedPassword, concurrentLogin] = await Promise.all([
      request('/api/customer/password', 'POST', passwordInput, newCookie),
      request('/api/customer/auth', 'POST', { action: 'login', email, password }),
    ]);
    assert.equal(changedPassword.status, 200);
    const rotatedCookie = changedPassword.headers.get('set-cookie').split(';')[0];
    assert.notEqual(rotatedCookie, newCookie);
    assert.equal((await request(`/api/test-orders/${id}`, 'GET', undefined, newCookie)).status, 401);
    assert.equal((await request(`/api/test-orders/${id}`, 'GET', undefined, secondCookie)).status, 401);
    if (concurrentLogin.status === 200) {
      const concurrentCookie = concurrentLogin.headers.get('set-cookie').split(';')[0];
      assert.equal((await request(`/api/test-orders/${id}`, 'GET', undefined, concurrentCookie)).status, 401);
    } else assert.equal(concurrentLogin.status, 401);
    assert.equal((await request(`/api/test-orders/${id}`, 'GET', undefined, rotatedCookie)).status, 200);
    assert.equal((await request('/api/customer/auth', 'POST', { action: 'login', email, password })).status, 401);
    const postChangeLogin = await request('/api/customer/auth', 'POST', { action: 'login', email, password: nextPassword });
    assert.equal(postChangeLogin.status, 200);
    const activeCookie = postChangeLogin.headers.get('set-cookie').split(';')[0];
    await prisma.user.update({ where: { id: customer.id }, data: { disabledAt: new Date() } });
    assert.equal((await request(`/api/test-orders/${id}`, 'GET', undefined, activeCookie)).status, 401);
    const failed = [];
    for (let i = 0; i < 11; i++) failed.push((await request('/api/customer/auth', 'POST', { action: 'login', email: otherEmail, password: 'Wrong-local-password' })).status);
    assert.ok(failed.includes(429));
  } finally {
    server.kill('SIGTERM'); disabledServer.kill('SIGTERM');
    await prisma.user.deleteMany({ where: { OR: [{ email }, { email: otherEmail }, ...(staffId ? [{ id: staffId }] : [])] } });
    if (categoryId) { await prisma.product.deleteMany({ where: { categoryId } }); await prisma.menuCategory.delete({ where: { id: categoryId } }); }
    await prisma.$disconnect();
  }
});
