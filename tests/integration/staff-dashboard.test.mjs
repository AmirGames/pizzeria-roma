import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { setTimeout } from 'node:timers/promises';
import { PrismaClient } from '@prisma/client';
import { createSessionToken } from '../../src/lib/session-token.mjs';
import { brusselsDayWindow } from '../../src/lib/staff-dashboard.mjs';

test('the manager dashboard exposes test aggregates only to authorized active managers', { skip: process.env.RUN_DATABASE_TESTS !== '1', timeout: 120000 }, async () => {
  assert.match(new URL(process.env.DATABASE_URL).pathname, /_test$/);
  const prisma = new PrismaClient();
  const origin = 'http://localhost:3230';
  const servers = [3230, 3240].map(port => spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-p', String(port)], { env: { ...process.env, APP_ORIGIN: `http://localhost:${port}`, ENABLE_TEST_ORDERS: port === 3230 ? 'true' : 'false' }, stdio: 'ignore' }));
  const users = [];
  const createUser = async (role = 'CUSTOMER') => {
    const session = createSessionToken();
    const user = await prisma.user.create({ data: { email: `dashboard-${randomUUID()}@example.test`, role, sessions: { create: { tokenHash: session.tokenHash, expiresAt: new Date(Date.now() + 600000) } } } });
    users.push(user.id); return { id: user.id, cookie: `roma_session=${session.token}` };
  };
  const get = cookie => fetch(origin + '/gerant', { headers: cookie ? { cookie } : {} });
  try {
    for (const port of [3230, 3240]) {
      let ready = false;
      for (let i = 0; i < 100; i++) { try { if ((await fetch(`http://localhost:${port}/compte`)).ok) { ready = true; break; } } catch { /* starting */ } await setTimeout(200); }
      assert.equal(ready, true);
    }
    const owner = await createUser(); const manager = await createUser('MANAGER'); const kitchen = await createUser('KITCHEN');
    const window = brusselsDayWindow(); const prefix = `DASH-${randomUUID()}`;
    const rows = ['PENDING', 'READY', 'COMPLETED'].map((status, i) => ({ id: `${prefix}-${i}`, publicReference: `${prefix}-${i}`, userId: owner.id, requestKey: randomUUID(), requestHash: '0'.repeat(64), fulfillment: 'PICKUP', contactName: 'Coordonnée confidentielle test', phone: '081 00 00 00', comment: 'Commentaire privé du test', status, totalCents: 1200, itemsSnapshot: [], placedAt: new Date(window.start.getTime() + 60000) }));
    await prisma.testOrder.createMany({ data: rows });
    for (const cookie of [undefined, owner.cookie, kitchen.cookie]) {
      const html = await (await get(cookie)).text(); assert.match(html, /Accès gérant requis/); assert.ok(!html.includes('Compteurs de la file'));
    }
    const response = await get(manager.cookie); assert.equal(response.status, 200); assert.match(response.headers.get('cache-control'), /no-store/);
    const html = await response.text();
    assert.match(html, /Tableau de bord gérant/); assert.match(html, /statut=PENDING/); assert.match(html, /statut=PREPARING/); assert.match(html, /statut=READY/);
    assert.ok(html.includes(window.date));
    for (const privateText of [prefix, 'Coordonnée confidentielle test', 'Commentaire privé du test', '081 00 00 00']) assert.ok(!html.includes(privateText));
    assert.equal(await prisma.testOrder.count({ where: { userId: owner.id } }), 3);
    assert.equal((await fetch('http://localhost:3240/gerant', { headers: { cookie: manager.cookie } })).status, 404);
    await prisma.user.update({ where: { id: manager.id }, data: { disabledAt: new Date() } });
    assert.match(await (await get(manager.cookie)).text(), /Accès gérant requis/);
    await prisma.user.update({ where: { id: manager.id }, data: { disabledAt: null, role: 'CUSTOMER' } });
    assert.match(await (await get(manager.cookie)).text(), /Accès gérant requis/);
  } finally {
    servers.forEach(server => server.kill('SIGTERM'));
    await prisma.user.deleteMany({ where: { id: { in: users } } });
    await prisma.$disconnect();
  }
});
