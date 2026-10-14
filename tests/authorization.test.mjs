import test from 'node:test';
import assert from 'node:assert/strict';
import { can, ROLES } from '../src/lib/authorization.mjs';
import { createSessionToken, hashSessionToken } from '../src/lib/session-token.mjs';

test('customers cannot access staff capabilities', () => {
  for (const permission of ['orders:read', 'orders:update-status', 'orders:refund', 'catalog:write', 'staff:manage', 'reports:read']) {
    assert.equal(can(ROLES.CUSTOMER, permission), false);
  }
});
test('kitchen cannot refund or manage staff', () => {
  assert.equal(can(ROLES.KITCHEN, 'orders:read'), true);
  assert.equal(can(ROLES.KITCHEN, 'orders:refund'), false);
  assert.equal(can(ROLES.KITCHEN, 'staff:manage'), false);
});
test('permissions are deny by default', () => {
  assert.equal(can('ADMIN', 'orders:read'), false);
  assert.equal(can(ROLES.MANAGER, 'unknown:action'), false);
});
test('session tokens are random and only hashes are stored', () => {
  const a = createSessionToken();
  const b = createSessionToken();
  assert.notEqual(a.token, b.token);
  assert.equal(a.tokenHash, hashSessionToken(a.token));
  assert.equal(a.tokenHash.length, 64);
  assert.throws(() => hashSessionToken('weak'));
});
