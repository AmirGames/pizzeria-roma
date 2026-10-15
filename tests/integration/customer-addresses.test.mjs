import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { setTimeout } from 'node:timers/promises';
import { PrismaClient } from '@prisma/client';
import { createSessionToken } from '../../src/lib/session-token.mjs';

test('saved addresses isolate owners and serialize defaults, edits and the ten-address limit', { skip: process.env.RUN_DATABASE_TESTS !== '1', timeout: 120000 }, async () => {
  assert.match(new URL(process.env.DATABASE_URL).pathname, /_test$/);
  const prisma = new PrismaClient();
  const origin = 'http://localhost:3140';
  const servers = [3140, 3150].map(port => spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-p', String(port)], { env: { ...process.env, APP_ORIGIN: `http://localhost:${port}`, ENABLE_TEST_ORDERS: port === 3140 ? 'true' : 'false' }, stdio: 'ignore' }));
  const users = [];
  const createUser = async (role = 'CUSTOMER') => {
    const session = createSessionToken();
    const user = await prisma.user.create({ data: { email: `address-${randomUUID()}@example.test`, role, sessions: { create: { tokenHash: session.tokenHash, expiresAt: new Date(Date.now() + 600000) } } } });
    users.push(user.id);
    return { id: user.id, cookie: `roma_session=${session.token}` };
  };
  const request = (method, path = '', body, cookie, requestOrigin = origin) => fetch(`${origin}/api/customer/addresses${path}`, { method, headers: { ...(method !== 'GET' ? { origin: requestOrigin, 'content-type': 'application/json' } : {}), ...(cookie ? { cookie } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
  const input = { label: 'Domicile', address: 'Rue fictive 1, 5000 Namur', zoneId: 'namur-centre', isDefault: false };
  const edit = address => ({ label: address.label, address: address.address, zoneId: address.zoneId, isDefault: address.isDefault, revision: address.revision });
  const list = async cookie => (await (await request('GET', '', undefined, cookie)).json()).addresses;
  try {
    for (const port of [3140, 3150]) {
      let ready = false;
      for (let i = 0; i < 100; i++) { try { if ((await fetch(`http://localhost:${port}/compte`)).ok) { ready = true; break; } } catch { /* starting */ } await setTimeout(200); }
      assert.equal(ready, true);
    }
    const owner = await createUser(); const other = await createUser(); const staff = await createUser('MANAGER');
    assert.equal((await request('GET')).status, 401);
    assert.equal((await request('POST', '', input)).status, 401);
    assert.equal((await request('GET', '', undefined, staff.cookie)).status, 401);
    for (const [method, path] of [['GET', ''], ['POST', ''], ['PATCH', '/unknown'], ['DELETE', '/unknown']]) assert.equal((await fetch(`http://localhost:3150/api/customer/addresses${path}`, { method })).status, 404);
    assert.equal((await request('POST', '', input, owner.cookie, 'https://evil.test')).status, 403);
    for (const change of [{ userId: other.id }, { revision: 0 }, { zoneId: 'unknown' }, { address: '' }]) assert.equal((await request('POST', '', { ...input, ...change }, owner.cookie)).status, 400);
    const created = await request('POST', '', input, owner.cookie);
    assert.equal(created.status, 201);
    assert.equal(created.headers.get('cache-control'), 'no-store');
    const first = (await created.json()).addresses[0];
    assert.equal(first.isDefault, true);
    assert.equal(Object.hasOwn(first, 'userId'), false);
    assert.deepEqual(await list(other.cookie), []);
    for (const method of ['PATCH', 'DELETE']) assert.equal((await request(method, `/${first.id}`, method === 'PATCH' ? edit(first) : { revision: first.revision }, other.cookie)).status, 404);
    assert.equal((await request('PATCH', `/${first.id}`, { ...edit(first), label: 'Maison' }, owner.cookie)).status, 200);
    assert.equal((await request('PATCH', `/${first.id}`, edit(first), owner.cookie)).status, 409);
    assert.equal((await request('DELETE', `/${first.id}`, { revision: first.revision }, owner.cookie)).status, 409);
    // Two creations asking to become default must leave exactly one default.
    const parallel = await Promise.all(['Travail', 'Autre'].map(label => request('POST', '', { ...input, label, isDefault: true }, owner.cookie)));
    assert.deepEqual(parallel.map(result => result.status), [201, 201]);
    let addresses = await list(owner.cookie);
    assert.equal(addresses.filter(address => address.isDefault).length, 1);
    const defaultAddress = addresses.find(address => address.isDefault);
    const replacement = addresses.find(address => !address.isDefault);
    assert.equal((await request('PATCH', `/${replacement.id}`, { ...edit(replacement), isDefault: true }, owner.cookie)).status, 200);
    assert.equal((await request('PATCH', `/${defaultAddress.id}`, edit(defaultAddress), owner.cookie)).status, 409);
    for (let i = 3; i < 9; i++) assert.equal((await request('POST', '', { ...input, label: `Essai ${i}` }, owner.cookie)).status, 201);
    const atLimit = await Promise.all([request('POST', '', input, owner.cookie), request('POST', '', input, owner.cookie)]);
    assert.deepEqual(atLimit.map(response => response.status).sort(), [201, 409]);
    addresses = await list(owner.cookie);
    assert.equal(addresses.length, 10);
    assert.equal(addresses.filter(address => address.isDefault).length, 1);
    const active = addresses.find(address => address.isDefault);
    assert.equal((await request('DELETE', `/${active.id}`, { revision: active.revision }, owner.cookie)).status, 200);
    addresses = await list(owner.cookie);
    assert.equal(addresses.length, 9);
    assert.equal(addresses.filter(address => address.isDefault).length, 1);
    while (addresses.length) {
      const address = addresses[0];
      assert.equal((await request('DELETE', `/${address.id}`, { revision: address.revision }, owner.cookie)).status, 200);
      addresses = await list(owner.cookie);
    }
    assert.equal((await request('DELETE', `/${first.id}`, { revision: 0 }, owner.cookie)).status, 404);
    assert.equal((await request('POST', '', input, owner.cookie)).status, 201);
    await prisma.user.update({ where: { id: owner.id }, data: { disabledAt: new Date() } });
    assert.equal((await request('GET', '', undefined, owner.cookie)).status, 401);
    await prisma.user.delete({ where: { id: owner.id } });
    assert.equal(await prisma.customerAddress.count({ where: { userId: owner.id } }), 0);
  } finally {
    servers.forEach(server => server.kill('SIGTERM'));
    await prisma.user.deleteMany({ where: { id: { in: users } } });
    await prisma.$disconnect();
  }
});
