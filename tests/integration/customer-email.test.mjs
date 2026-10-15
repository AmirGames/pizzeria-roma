import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID, createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { setTimeout } from 'node:timers/promises';
import { PrismaClient } from '@prisma/client';
import { capturedLink } from '../helpers/mailpit.mjs';
const enabled = process.env.RUN_DATABASE_TESTS === '1';

test('local mailbox, email verification and single-use recovery invalidate previous access', { skip: !enabled, timeout: 120000 }, async () => {
  assert.match(new URL(process.env.DATABASE_URL).pathname, /_test$/);
  const prisma = new PrismaClient();
  const origin = 'http://localhost:3130';
  const server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-p', '3130'], { env: { ...process.env, APP_ORIGIN: origin, ENABLE_TEST_ORDERS: 'true', LOCAL_MAIL_URL: 'http://127.0.0.1:8025' }, stdio: 'ignore' });
  const email = `email-${randomUUID()}@example.test`;
  const password = 'Email-local-test-password';
  const hash = token => createHash('sha256').update(token).digest('hex');
  const request = (path, body, cookie, requestOrigin = origin) => fetch(origin + path, { method: 'POST', headers: { origin: requestOrigin, 'content-type': 'application/json', ...(cookie ? { cookie } : {}) }, body: JSON.stringify(body) });
  const tokenOf = url => new URL(url).hash.slice(1);
  try {
    let ready = false;
    for (let i = 0; i < 100; i++) { try { if ((await fetch(origin + '/compte')).ok) { ready = true; break; } } catch { /* starting */ } await setTimeout(200); }
    assert.equal(ready, true);
    const signup = await request('/api/customer/auth', { action: 'register', email, name: 'Email test', password });
    assert.equal(signup.status, 200);
    const cookie = signup.headers.get('set-cookie').split(';')[0];
    const user = await prisma.user.findUnique({ where: { email } });
    const verifyToken = tokenOf(await capturedLink(email, '/compte/verifier'));
    const stored = await prisma.customerEmailToken.findUnique({ where: { tokenHash: hash(verifyToken) } });
    assert.equal(stored.purpose, 'VERIFY_EMAIL');
    assert.notEqual(stored.tokenHash, verifyToken);
    assert.equal(user.emailVerified, null);
    assert.equal((await request('/api/customer/email/reset', { token: verifyToken, newPassword: 'Other-test-password', confirmation: 'Other-test-password' })).status, 400);
    assert.equal((await request('/api/customer/email/verify', { token: verifyToken }, undefined, 'https://evil.test')).status, 403);
    // Reading the page never consumes the token.
    assert.equal((await fetch(origin + '/compte/verifier')).status, 200);
    assert.ok(await prisma.customerEmailToken.findUnique({ where: { tokenHash: hash(verifyToken) } }));
    const verified = await Promise.all([request('/api/customer/email/verify', { token: verifyToken }), request('/api/customer/email/verify', { token: verifyToken })]);
    assert.deepEqual(verified.map(response => response.status).sort(), [200, 400]);
    assert.ok((await prisma.user.findUnique({ where: { id: user.id } })).emailVerified);
    const missing = await request('/api/customer/email/request', { action: 'reset', email: `missing-${randomUUID()}@example.test` });
    const known = await request('/api/customer/email/request', { action: 'reset', email });
    assert.equal(missing.status, 200); assert.equal(known.status, 200);
    assert.deepEqual(await missing.json(), await known.json());
    const expired = tokenOf(await capturedLink(email, '/compte/reinitialiser'));
    await prisma.customerEmailToken.update({ where: { tokenHash: hash(expired) }, data: { expiresAt: new Date(Date.now() - 1000) } });
    const resetBody = token => ({ token, newPassword: 'Recovered-local-password', confirmation: 'Recovered-local-password' });
    assert.equal((await request('/api/customer/email/reset', resetBody(expired))).status, 400);
    assert.equal((await request('/api/customer/email/request', { action: 'reset', email })).status, 200);
    const invalidated = tokenOf(await capturedLink(email, '/compte/reinitialiser'));
    assert.notEqual(invalidated, expired);
    const change = await request('/api/customer/password', { currentPassword: password, newPassword: 'Changed-local-password', confirmation: 'Changed-local-password' }, cookie);
    assert.equal(change.status, 200);
    const changedCookie = change.headers.get('set-cookie').split(';')[0];
    assert.equal((await request('/api/customer/email/reset', resetBody(invalidated))).status, 400);
    assert.equal((await request('/api/customer/email/request', { action: 'reset', email })).status, 200);
    const resetToken = tokenOf(await capturedLink(email, '/compte/reinitialiser'));
    const reset = await Promise.all([request('/api/customer/email/reset', resetBody(resetToken)), request('/api/customer/email/reset', resetBody(resetToken))]);
    assert.deepEqual(reset.map(response => response.status).sort(), [200, 400]);
    assert.equal(await prisma.session.count({ where: { userId: user.id } }), 0);
    assert.equal((await fetch(origin + '/api/test-orders/unknown', { headers: { cookie: changedCookie } })).status, 401);
    assert.equal((await request('/api/customer/email/reset', resetBody(resetToken))).status, 400);
    assert.equal((await request('/api/customer/auth', { action: 'login', email, password: 'Changed-local-password' })).status, 401);
    assert.equal((await request('/api/customer/auth', { action: 'login', email, password: 'Recovered-local-password' })).status, 200);
    assert.ok((await prisma.user.findUnique({ where: { id: user.id } })).emailVerified);
  } finally {
    server.kill('SIGTERM');
    await prisma.user.deleteMany({ where: { email } });
    await prisma.$disconnect();
  }
});
