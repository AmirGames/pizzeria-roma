import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { setTimeout } from 'node:timers/promises';
import { PrismaClient } from '@prisma/client';
import { createSessionToken } from '../../src/lib/session-token.mjs';

test('customer history paginates all owned orders with deterministic filters and private counts', { skip: process.env.RUN_DATABASE_TESTS !== '1', timeout: 120000 }, async () => {
  assert.match(new URL(process.env.DATABASE_URL).pathname, /_test$/);
  const prisma = new PrismaClient();
  const origin = 'http://localhost:3180';
  const servers = [3180, 3190].map(port => spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-p', String(port)], { env: { ...process.env, APP_ORIGIN: `http://localhost:${port}`, ENABLE_TEST_ORDERS: port === 3180 ? 'true' : 'false' }, stdio: 'ignore' }));
  const users = [];
  const createUser = async (role = 'CUSTOMER') => {
    const session = createSessionToken(); const suffix = randomUUID();
    const user = await prisma.user.create({ data: { email: `history-${suffix}@example.test`, role, sessions: { create: { tokenHash: session.tokenHash, expiresAt: new Date(Date.now() + 600000) } } } });
    users.push(user.id); return { id: user.id, suffix, cookie: `roma_session=${session.token}` };
  };
  const get = (query = '', cookie) => fetch(`${origin}/compte${query}`, { headers: cookie ? { cookie } : {} });
  const ids = html => [...html.matchAll(/<a[^>]+href="\/compte\/commandes\/([^"?#]+)"/g)].map(match => match[1]);
  const plain = html => html.replace(/<!--.*?-->/gs, '').replace(/<[^>]*>/g, '');
  const fixtures = (user, length) => Array.from({ length }, (_, i) => ({ id: `history-${user.suffix}-${String(i).padStart(3, '0')}`, userId: user.id, publicReference: `TEST-${user.suffix.toUpperCase()}-${String(i).padStart(3, '0')}`, requestKey: randomUUID(), requestHash: '0'.repeat(64), fulfillment: 'PICKUP', contactName: 'Historique fictif', phone: '081 00 00 00', status: i % 2 ? 'CANCELLED' : 'PENDING', totalCents: 1200, itemsSnapshot: [], placedAt: new Date('2026-01-01T12:00:00Z') }));
  try {
    for (const port of [3180, 3190]) {
      let ready = false;
      for (let i = 0; i < 100; i++) { try { if ((await fetch(`http://localhost:${port}/compte`)).ok) { ready = true; break; } } catch { /* starting */ } await setTimeout(200); }
      assert.equal(ready, true);
    }
    const owner = await createUser(); const other = await createUser(); const staff = await createUser('MANAGER');
    const owned = fixtures(owner, 55); const foreign = fixtures(other, 4);
    await prisma.testOrder.createMany({ data: [...owned, ...foreign] });
    const page = await get('', owner.cookie);
    assert.equal(page.status, 200); assert.match(page.headers.get('cache-control'), /no-store/);
    const first = await page.text();
    assert.deepEqual(ids(first), owned.slice(35).reverse().map(row => row.id));
    assert.match(plain(first), /Page 1 sur 3/);
    assert.match(plain(first), /sur 55/);
    const second = await (await get('?page=2', owner.cookie)).text();
    assert.deepEqual(ids(second), owned.slice(15, 35).reverse().map(row => row.id));
    const last = await (await get('?page=3', owner.cookie)).text();
    assert.deepEqual(ids(last), owned.slice(0, 15).reverse().map(row => row.id));
    assert.equal(new Set([...ids(first), ...ids(second), ...ids(last)]).size, 55);
    assert.deepEqual(ids(await (await get('?page=999999999', owner.cookie)).text()), ids(last));
    const filtered = await (await get('?statut=CANCELLED&page=2', owner.cookie)).text();
    assert.deepEqual(ids(filtered), owned.filter(row => row.status === 'CANCELLED').reverse().slice(20).map(row => row.id));
    assert.match(plain(filtered), /sur 27/);
    assert.match(filtered, /statut=CANCELLED/);
    assert.deepEqual(ids(await (await get(`?q=${owned[0].publicReference.toLowerCase()}`, owner.cookie)).text()), [owned[0].id]);
    assert.deepEqual(ids(await (await get(`?q=${owned[0].publicReference}&statut=CANCELLED`, owner.cookie)).text()), []);
    assert.deepEqual(ids(await (await get(`?q=${foreign[0].publicReference}&userId=${other.id}`, owner.cookie)).text()), []);
    assert.deepEqual(ids(await (await get('?page=1', other.cookie)).text()), foreign.reverse().map(row => row.id));
    for (const query of ['?page=-1', '?statut=UNKNOWN', '?q=%25', '?page=1&page=2']) {
      const response = await get(query, owner.cookie); assert.equal(response.status, 200);
      const html = await response.text(); assert.match(html, /Filtres invalides/); assert.deepEqual(ids(html), ids(first));
    }
    assert.deepEqual(ids(await (await get('?page=3')).text()), []);
    assert.deepEqual(ids(await (await get('?page=3', staff.cookie)).text()), []);
    assert.deepEqual(ids(await (await fetch('http://localhost:3190/compte?page=3', { headers: { cookie: owner.cookie } })).text()), []);
    await prisma.user.update({ where: { id: owner.id }, data: { disabledAt: new Date() } });
    assert.deepEqual(ids(await (await get('', owner.cookie)).text()), []);
  } finally {
    servers.forEach(server => server.kill('SIGTERM'));
    await prisma.user.deleteMany({ where: { id: { in: users } } });
    await prisma.$disconnect();
  }
});
