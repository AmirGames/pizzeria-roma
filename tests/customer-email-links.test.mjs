import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeRecoveryEmail, emailLinkOrigin, localMailOrigin } from '../src/lib/customer-email-links.mjs';
import { validatePasswordReset } from '../src/lib/customer-profile.mjs';
test('normalizes recovery requests without accepting invalid addresses', () => {
  assert.equal(normalizeRecoveryEmail(' CLIENT@EXAMPLE.TEST '), 'client@example.test');
  for (const value of [null, '', 'invalid', 'a\nb@example.test']) assert.throws(() => normalizeRecoveryEmail(value), /INVALID_REQUEST/);
});
test('keeps local mailbox traffic on loopback and derives links from a configured origin', () => {
  assert.equal(localMailOrigin('http://127.0.0.1:8025'), 'http://127.0.0.1:8025');
  assert.equal(emailLinkOrigin('https://preview.example.test'), 'https://preview.example.test');
  for (const url of ['https://smtp.example.test', 'http://evil.test:8025', 'http://localhost:8025/path', 'http://user:password@localhost:8025', 'http://localhost:8025?to=evil']) assert.throws(() => localMailOrigin(url), /MAIL_UNAVAILABLE/);
  assert.throws(() => emailLinkOrigin('http://untrusted.example.test'), /MAIL_UNAVAILABLE/);
});
test('a password reset requires a token and a strong matching confirmation', () => {
  const input = { token: 'a'.repeat(43), newPassword: 'Reset-local-password', confirmation: 'Reset-local-password' };
  assert.equal(validatePasswordReset(input).newPassword, input.newPassword);
  for (const change of [{ userId: 'other' }, { token: 'bad' }, { newPassword: 'short', confirmation: 'short' }, { confirmation: 'different' }]) assert.throws(() => validatePasswordReset({ ...input, ...change }));
});
