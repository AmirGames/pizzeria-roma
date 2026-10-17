import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { setTimeout } from 'node:timers/promises';
import { PrismaClient } from '@prisma/client';
import { createSessionToken } from '../../src/lib/session-token.mjs';

const enabled = process.env.RUN_DATABASE_TESTS === '1';

test('manager authentication and catalogue mutations against PostgreSQL and Next.js', { skip: !enabled, timeout: 90000 }, async () => {
  const database = new URL(process.env.DATABASE_URL);
  assert.match(database.pathname, /_test$/, 'Integration tests require a dedicated *_test database');
  const prisma = new PrismaClient();
  const origin = 'http://localhost:3100';
  const server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-p', '3100'], { env: { ...process.env, APP_ORIGIN: origin }, stdio: ['ignore', 'pipe', 'pipe'] });
  let output = '';
  server.stdout.on('data', value => { output += value; });
  server.stderr.on('data', value => { output += value; });
  let category, manager;
  const request = (path, { method = 'GET', body, cookie, requestOrigin = origin } = {}) => fetch(origin + path, { method, headers: { ...(method !== 'GET' ? { origin: requestOrigin, 'content-type': 'application/json' } : {}), ...(cookie ? { cookie } : {}) }, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
  try {
    let ready = false;
    for (let attempt = 0; attempt < 100; attempt++) {
      if (server.exitCode !== null) throw new Error(output);
      try { if ((await request('/gerant/connexion')).ok) { ready = true; break; } } catch { /* Server starting. */ }
      await setTimeout(200);
    }
    assert.equal(ready, true, output);
    category = await prisma.menuCategory.create({ data: { nameFr: 'CI pizza', nameEn: 'CI pizza', fulfillmentCategory: 'PIZZA', products: { create: { nameFr: 'CI recipe', nameEn: 'CI recipe', baseCents: 0, sizes: { create: [{ label: '33 cm', priceCents: 1000 }, { label: '50 cm', priceCents: 2000 }] } } } }, include: { products: { include: { sizes: true } } } });
    const product = category.products[0];
    const [small, large] = [...product.sizes].sort((a, b) => a.priceCents - b.priceCents);
    manager = await prisma.user.create({ data: { email: `ci-${product.id}@example.test`, role: 'MANAGER' } });
    const access = createSessionToken();
    await prisma.managerAccessToken.create({ data: { tokenHash: access.tokenHash, userId: manager.id, expiresAt: new Date(Date.now() + 60000) } });
    const edit = { revision: 0, categoryId: category.id, nameFr: 'CI pizza updated', baseCents: 0, active: true, ingredients: ['Tomate'], removableIngredients: ['Tomate'], sizes: product.sizes.map(size => ({ id: size.id, priceCents: size.priceCents, active: true })), extras: [{ nameFr: 'Chèvre', priceCents: 0, active: true, sizePrices: { [small.id]: 150, [large.id]: 300 } }] };
    assert.equal((await request(`/api/manager/products/${product.id}`, { method: 'PATCH', body: edit })).status, 403);
    assert.equal((await request('/api/manager/session', { method: 'POST', body: { token: access.token }, requestOrigin: 'https://evil.example' })).status, 403);
    const login = await request('/api/manager/session', { method: 'POST', body: { token: access.token } });
    assert.equal(login.status, 200);
    const setCookie = login.headers.get('set-cookie');
    assert.match(setCookie, /HttpOnly/i);
    assert.match(setCookie, /Secure/i);
    const cookie = setCookie.split(';')[0];
    const creation = { categoryId: category.id, nameFr: 'CI draft', nameEn: 'CI draft', baseCents: 0, ingredients: ['Tomate'], removableIngredients: ['Tomate'], sizes: [{ label: '33 cm', priceCents: 1300 }] };
    assert.equal((await request('/api/manager/products', { method: 'POST', body: creation })).status, 403);
    assert.equal((await request('/api/manager/products', { method: 'POST', cookie, body: creation, requestOrigin: 'https://evil.example' })).status, 403);
    assert.equal((await request('/api/manager/products', { method: 'POST', cookie, body: { ...creation, active: true } })).status, 400);
    assert.equal((await request('/api/manager/products', { method: 'POST', cookie, body: { ...creation, categoryId: 'missing' } })).status, 400);
    const otherCategory = await prisma.menuCategory.create({ data: { nameFr: 'CI other', nameEn: 'CI other', fulfillmentCategory: 'OTHER' } });
    try {
      assert.equal((await request('/api/manager/products', { method: 'POST', cookie, body: { ...creation, categoryId: otherCategory.id } })).status, 400);
    } finally { await prisma.menuCategory.delete({ where: { id: otherCategory.id } }); }
    const draftResponse = await request('/api/manager/products', { method: 'POST', cookie, body: creation });
    assert.equal(draftResponse.status, 201);
    const { product: draft } = await draftResponse.json();
    assert.equal(draft.active, false);
    assert.equal(draft.sizes.length, 1);
    assert.equal(draft.sizes[0].priceCents, 1300);
    const beforePublish = await (await request('/api/catalog')).json();
    assert.equal(beforePublish.categories.flatMap(item => item.products).some(item => item.id === draft.id), false);
    const publishDraft = { revision: 0, categoryId: category.id, nameFr: draft.nameFr, active: true, baseCents: 0, ingredients: ['Tomate'], removableIngredients: ['Tomate'], sizes: draft.sizes.map(size => ({ id: size.id, priceCents: size.priceCents, active: true })), extras: [] };
    assert.equal((await request(`/api/manager/products/${draft.id}`, { method: 'PATCH', cookie, body: publishDraft })).status, 200);
    const afterPublish = await (await request('/api/catalog')).json();
    assert.equal(afterPublish.categories.flatMap(item => item.products).some(item => item.id === draft.id), true);

    assert.equal((await request('/api/manager/session', { method: 'POST', body: { token: access.token } })).status, 401);
    assert.equal((await request(`/api/manager/products/${product.id}`, { method: 'PATCH', cookie, body: edit, requestOrigin: 'https://evil.example' })).status, 403);
    const results = await Promise.all([request(`/api/manager/products/${product.id}`, { method: 'PATCH', cookie, body: edit }), request(`/api/manager/products/${product.id}`, { method: 'PATCH', cookie, body: edit })]);
    assert.deepEqual(results.map(response => response.status).sort(), [200, 409]);
    const updated = await prisma.product.findUnique({ where: { id: product.id }, include: { extras: true } });
    assert.equal(updated.catalogRevision, 1);
    assert.equal(updated.extras.length, 1);
    const catalogResponse = await request('/api/catalog');
    assert.equal(catalogResponse.status, 200);
    const catalog = await catalogResponse.json();
    const published = catalog.categories.find(item => item.id === category.id).products.find(item => item.id === product.id);
    assert.equal(published.sizes.length, 2);
    assert.deepEqual(published.removableIngredients, ['Tomate']);
    assert.deepEqual(published.extras[0].sizePrices, { [small.id]: 150, [large.id]: 300 });
    for (const [sizeId, expected] of [[small.id, 1150], [large.id, 2300]]) {
      const response = await request('/api/cart/preview', { method: 'POST', body: { mode: 'pickup', items: [{ productId: product.id, sizeId, extraIds: [updated.extras[0].id], removedIngredients: ['Tomate'], quantity: 1 }] } });
      assert.equal(response.status, 200);
      const preview = await response.json();
      assert.equal(preview.subtotalCents, expected);
      assert.deepEqual(preview.items[0].removedIngredients, ['Tomate']);
    }
    const bad = await request('/api/cart/preview', { method: 'POST', body: { mode: 'pickup', items: [{ productId: product.id, sizeId: small.id, removedIngredients: ['Unknown'], quantity: 1 }] } });
    assert.equal(bad.status, 400);
    // The authenticated role is re-read from the database for every mutation.
    await prisma.user.update({ where: { id: manager.id }, data: { role: 'CUSTOMER' } });
    assert.equal((await request(`/api/manager/products/${product.id}`, { method: 'PATCH', cookie, body: { ...edit, revision: 1 } })).status, 403);
    assert.equal((await request('/api/manager/session', { method: 'DELETE', cookie })).status, 200);
    assert.equal(await prisma.session.count({ where: { userId: manager.id } }), 0);
  } finally {
    server.kill('SIGTERM');
    if (category) { await prisma.product.deleteMany({ where: { categoryId: category.id } }); await prisma.menuCategory.delete({ where: { id: category.id } }); }
    if (manager) await prisma.user.delete({ where: { id: manager.id } });
    await prisma.$disconnect();
  }
});
