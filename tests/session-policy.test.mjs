import test from 'node:test';
import assert from 'node:assert/strict';
import { isActiveSession, SESSION_COOKIE_OPTIONS } from '../src/lib/session-policy.mjs';

const now = new Date('2026-10-14T12:00:00.000Z');
const active = { expiresAt: new Date('2026-10-15T12:00:00.000Z'), revokedAt: null, user: { disabledAt: null } };

test('only unexpired, non-revoked sessions for active users are accepted', () => {
  assert.equal(isActiveSession(active, now), true);
  assert.equal(isActiveSession({ ...active, expiresAt: now }, now), false);
  assert.equal(isActiveSession({ ...active, revokedAt: now }, now), false);
  assert.equal(isActiveSession({ ...active, user: { disabledAt: now } }, now), false);
  assert.equal(isActiveSession(null, now), false);
});
test('session cookies are HttpOnly, Secure and SameSite', () => {
  assert.equal(SESSION_COOKIE_OPTIONS.httpOnly, true);
  assert.equal(SESSION_COOKIE_OPTIONS.secure, true);
  assert.equal(SESSION_COOKIE_OPTIONS.sameSite, 'lax');
});
