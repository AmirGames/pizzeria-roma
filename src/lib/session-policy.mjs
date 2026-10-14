export const SESSION_COOKIE = 'roma_session';
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;
export const SESSION_COOKIE_OPTIONS = Object.freeze({
  httpOnly: true,
  secure: true,
  sameSite: 'lax',
  path: '/',
  maxAge: SESSION_TTL_SECONDS,
});
export function isActiveSession(session, now = new Date()) {
  return Boolean(session && !session.revokedAt && session.expiresAt instanceof Date && session.expiresAt > now && session.user && !session.user.disabledAt);
}
