import test from 'node:test';
import assert from 'node:assert/strict';
import { createSessionToken, hashSessionToken } from '../src/lib/session-token.mjs';
import { redeemManagerAccess } from '../src/lib/manager-access.mjs';

function database({ role = 'MANAGER', disabledAt = null, expired = false } = {}) {
  const { token, tokenHash } = createSessionToken();
  let available = true;
  const sessions = [];
  const record = { tokenHash, userId: 'manager', expiresAt: new Date(Date.now() + (expired ? -1 : 60000)), user: { role, disabledAt } };
  const tx = {
    managerAccessToken: {
      async findUnique({ where }) { return available && where.tokenHash === tokenHash ? record : null; },
      async deleteMany() { const count = available ? 1 : 0; available = false; return { count }; },
    },
    session: { async create({ data }) { sessions.push(data); } },
  };
  return { tx, token, sessions };
}

test('one-time manager access stores only a new token hash and cannot be reused', async () => {
  const { tx, token, sessions } = database();
  const sessionToken = await redeemManagerAccess(tx, token);
  assert.notEqual(sessionToken, token);
  assert.equal(sessions.length, 1);
  assert.equal(sessions[0].tokenHash, hashSessionToken(sessionToken));
  assert.equal(sessions[0].userId, 'manager');
  assert.ok(sessions[0].expiresAt > new Date());
  assert.equal(JSON.stringify(sessions).includes(sessionToken), false);
  await assert.rejects(redeemManagerAccess(tx, token), /INVALID_ACCESS/);
});

test('rejects expired links, disabled accounts, wrong roles and invalid tokens', async () => {
  for (const options of [{ expired: true }, { role: 'CUSTOMER' }, { role: 'KITCHEN' }, { disabledAt: new Date() }]) {
    const { tx, token, sessions } = database(options);
    await assert.rejects(redeemManagerAccess(tx, token), /INVALID_ACCESS/);
    assert.equal(sessions.length, 0);
  }
  const { tx } = database();
  await assert.rejects(redeemManagerAccess(tx, 'invalid'), /INVALID_ACCESS/);
});

test('parallel redemptions create only one session', async () => {
  const { tx, token, sessions } = database();
  const results = await Promise.allSettled([redeemManagerAccess(tx, token), redeemManagerAccess(tx, token)]);
  assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
  assert.equal(sessions.length, 1);
});
