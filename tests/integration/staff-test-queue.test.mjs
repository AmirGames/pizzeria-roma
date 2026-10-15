import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { setTimeout } from 'node:timers/promises';
import { PrismaClient } from '@prisma/client';
import { createSessionToken } from '../../src/lib/session-token.mjs';

test('the professional queue paginates more than one hundred tests with role and mode checks', { skip: process.env.RUN_DATABASE_TESTS !== '1', timeout: 120000 }, async () => {
  assert.match(new URL(process.env.DATABASE_URL).pathname, /_test$/);
  const prisma = new PrismaClient();
  const origin = 'http://localhost:3210';
  const servers = [3210, 3220].map(port => spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-p', String(port)], { env: { ...process.env, APP_ORIGIN: `http://localhost:${port}`, ENABLE_TEST_ORDERS: port === 3210 ? 'true' : 'false' }, stdio: 'ignore' }));
  const users = [];
  const createUser = async (role = 'CUSTOMER') => {
    const session = createSessionToken();
    const user = await prisma.user.create({ data: { email: `queue-${randomUUID()}@example.test`, role, sessions: { create: { tokenHash: session.tokenHash, expiresAt: new Date(Date.now() + 600000) } } } });
    users.push(user.id); return { id: user.id, cookie: `roma_session=${session.token}` };
  };
  const prefix = `TEST-QUEUE-${randomUUID().slice(0, 8).toUpperCase()}`;
  const get = (query = '', cookie) => fetch(`${origin}/gerant/commandes-test?q=${prefix}${query}`, { headers: cookie ? { cookie } : {} });
  const ids = html => [...html.matchAll(/<h3 id="staff-order-([^"?#]+)"/g)].map(match => match[1]);
  const plain = html => html.replace(/<!--.*?-->/gs, '').replace(/<[^>]*>/g, '');
  try {
    for (const port of [3210, 3220]) {
      let ready = false;
      for (let i = 0; i < 100; i++) { try { if ((await fetch(`http://localhost:${port}/compte`)).ok) { ready = true; break; } } catch { /* starting */ } await setTimeout(200); }
      assert.equal(ready, true);
    }
    const owner = await createUser(); const other = await createUser(); const manager = await createUser('MANAGER'); const kitchen = await createUser('KITCHEN');
    const rows = Array.from({ length: 126 }, (_, i) => ({ id: `${prefix}-${String(i).padStart(3, '0')}`, userId: i % 2 ? owner.id : other.id, publicReference: `${prefix}-${String(i).padStart(3, '0')}`, requestKey: randomUUID(), requestHash: '0'.repeat(64), fulfillment: i % 3 ? 'PICKUP' : 'DELIVERY', address: i % 3 ? null : 'Rue fictive 1, 5000 Namur', zoneId: i % 3 ? null : 'namur-centre', contactName: 'Client fictif de la file', phone: '081 00 00 00', status: i >= 120 ? 'COMPLETED' : i % 2 ? 'READY' : 'PENDING', totalCents: 1200, itemsSnapshot: [], placedAt: new Date('2026-01-01T12:00:00Z') }));
    await prisma.testOrder.createMany({ data: rows });
    const firstResponse = await get('', manager.cookie);
    assert.equal(firstResponse.status, 200); assert.match(firstResponse.headers.get('cache-control'), /no-store/);
    const first = await firstResponse.text();
    assert.deepEqual(ids(first), rows.slice(0, 20).map(row => row.id));
    assert.match(plain(first), /sur 120/);
    const pages = [];
    for (let page = 1; page <= 6; page++) pages.push(...ids(await (await get(`&page=${page}`, kitchen.cookie)).text()));
    assert.equal(new Set(pages).size, 120);
    assert.deepEqual(pages, rows.slice(0, 120).map(row => row.id));
    assert.deepEqual(ids(await (await get('&tri=newest', manager.cookie)).text()), rows.slice(100, 120).reverse().map(row => row.id));
    const closed = await (await get('&statut=COMPLETED', kitchen.cookie)).text();
    assert.deepEqual(ids(closed), rows.slice(120).map(row => row.id));
    const combined = await (await get('&statut=PENDING&mode=DELIVERY', manager.cookie)).text();
    assert.deepEqual(ids(combined), rows.filter(row => row.status === 'PENDING' && row.fulfillment === 'DELIVERY').map(row => row.id));
    assert.deepEqual(ids(await (await get('&statut=all&page=999999999', manager.cookie)).text()), rows.slice(120).map(row => row.id));
    const exact = await fetch(`${origin}/gerant/commandes-test?q=${rows[125].publicReference.toLowerCase()}&statut=all`, { headers: { cookie: manager.cookie } });
    assert.deepEqual(ids(await exact.text()), [rows[125].id]);
    // A repeated reference is rejected, then the default active queue is used.
    const repeated = await (await get('&statut=PENDING&mode=PICKUP&q=NO-MATCH', manager.cookie)).text();
    assert.match(repeated, /Filtres invalides/);
    assert.ok(ids(repeated).length <= 20);
    assert.ok(!ids(repeated).some(id => rows.slice(120).some(row => row.id === id)));
    const invalid = await (await get('&mode=invalid', manager.cookie)).text();
    assert.match(invalid, /Filtres invalides/);
    assert.ok(!ids(invalid).some(id => rows.slice(120).some(row => row.id === id)));
    assert.deepEqual(ids(await (await get('&role=MANAGER', owner.cookie)).text()), []);
    assert.deepEqual(ids(await (await get()).text()), []);
    assert.equal((await fetch('http://localhost:3220/gerant/commandes-test', { headers: { cookie: manager.cookie } })).status, 404);
    await prisma.user.update({ where: { id: kitchen.id }, data: { disabledAt: new Date() } });
    assert.deepEqual(ids(await (await get('', kitchen.cookie)).text()), []);
  } finally {
    servers.forEach(server => server.kill('SIGTERM'));
    await prisma.user.deleteMany({ where: { id: { in: users } } });
    await prisma.$disconnect();
  }
});
