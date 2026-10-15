import test from 'node:test';
import assert from 'node:assert/strict';
import { hashCustomerPassword, verifyCustomerPassword, validateCustomerAuth } from '../src/lib/customer-password.mjs';
test('hashes with unique salts and verifies without storing the password', async () => {
  const password = 'Long-local-test-password';
  const first = await hashCustomerPassword(password);
  const second = await hashCustomerPassword(password);
  assert.notEqual(first, second);
  assert.equal(first.includes(password), false);
  assert.equal(await verifyCustomerPassword(password, first), true);
  assert.equal(await verifyCustomerPassword('Wrong-local-password', first), false);
  assert.equal(await verifyCustomerPassword(password, null), false);
});
test('normalizes email and prevents role injection and weak passwords', () => {
  const input = { action: 'register', email: ' CLIENT@EXAMPLE.TEST ', password: 'Long-local-test-password', name: ' Client ' };
  assert.equal(validateCustomerAuth(input).email, 'client@example.test');
  assert.equal(validateCustomerAuth(input).name, 'Client');
  for (const changes of [{ role: 'MANAGER' }, { password: 'short' }, { password: '😀'.repeat(100) }, { email: 'invalid' }, { name: '' }]) assert.throws(() => validateCustomerAuth({ ...input, ...changes }), /INVALID_AUTH/);
});
