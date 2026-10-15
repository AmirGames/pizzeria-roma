import test from 'node:test';
import assert from 'node:assert/strict';
import { validateCustomerProfile, validatePasswordChange } from '../src/lib/customer-profile.mjs';
test('normalizes profile fields and permits clearing a phone number', () => {
  assert.deepEqual(validateCustomerProfile({ name: ' Client ', phone: ' 081 00 00 00 ' }), { name: 'Client', phone: '081 00 00 00' });
  assert.equal(validateCustomerProfile({ name: 'Client', phone: '' }).phone, null);
  for (const changes of [{ role: 'MANAGER' }, { userId: 'other' }, { email: 'other@example.test' }, { name: '' }, { phone: 'invalid' }]) assert.throws(() => validateCustomerProfile({ name: 'Client', phone: '', ...changes }), /INVALID_PROFILE/);
});
test('requires a different strong password, the current password and matching confirmation', () => {
  const input = { currentPassword: 'Current-test-password', newPassword: 'New-customer-password', confirmation: 'New-customer-password' };
  assert.equal(validatePasswordChange(input).newPassword, input.newPassword);
  for (const changes of [{ currentPassword: '' }, { newPassword: 'short', confirmation: 'short' }, { confirmation: 'different' }, { newPassword: input.currentPassword, confirmation: input.currentPassword }, { userId: 'other' }, { newPassword: '😀'.repeat(100), confirmation: '😀'.repeat(100) }]) assert.throws(() => validatePasswordChange({ ...input, ...changes }), /INVALID_PROFILE/);
});
