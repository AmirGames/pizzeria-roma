import { createSessionToken, hashSessionToken } from './session-token.mjs';

export function normalizeRecoveryEmail(value) {
  if (typeof value !== 'string' || value.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) throw new Error('INVALID_REQUEST');
  return value.trim().toLowerCase();
}
export function localMailOrigin(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'http:' || !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) || url.username || url.password || url.pathname !== '/' || url.search || url.hash) throw new Error();
    return url.origin;
  } catch { throw new Error('MAIL_UNAVAILABLE'); }
}
export function emailLinkOrigin(value) {
  try {
    const url = new URL(value);
    if ((url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname))) || url.username || url.password || url.pathname !== '/' || url.search || url.hash) throw new Error();
    return url.origin;
  } catch { throw new Error('MAIL_UNAVAILABLE'); }
}

/** The credential lock serializes issuance, consumption, login and password changes. */
export async function prepareCustomerEmailToken(tx, userId, purpose, now = new Date()) {
  if (!['VERIFY_EMAIL', 'RESET_PASSWORD'].includes(purpose)) throw new Error('INVALID_LINK');
  const user = await tx.user.findFirst({ where: { id: userId, role: 'CUSTOMER', disabledAt: null }, include: { customerCredential: true } });
  if (!user?.customerCredential || (purpose === 'VERIFY_EMAIL' && user.emailVerified)) return null;
  const matched = await tx.customerCredential.updateMany({ where: { userId, passwordHash: user.customerCredential.passwordHash, version: user.customerCredential.version }, data: { passwordHash: user.customerCredential.passwordHash } });
  if (matched.count !== 1) return null;
  await tx.customerEmailToken.deleteMany({ where: { userId, purpose } });
  const { token, tokenHash } = createSessionToken();
  const expiresAt = new Date(now.getTime() + (purpose === 'RESET_PASSWORD' ? 15 * 60 * 1000 : 24 * 60 * 60 * 1000));
  await tx.customerEmailToken.create({ data: { tokenHash, userId, email: user.email, purpose, credentialVersion: user.customerCredential.version, expiresAt } });
  return { token, tokenHash, email: user.email, expiresAt };
}

export async function redeemCustomerEmailToken(tx, token, purpose, passwordHash) {
  let tokenHash;
  try { tokenHash = hashSessionToken(token); } catch { throw new Error('INVALID_LINK'); }
  const link = await tx.customerEmailToken.findUnique({ where: { tokenHash } });
  if (!link || link.purpose !== purpose || link.expiresAt <= new Date()) throw new Error('INVALID_LINK');
  const credential = await tx.customerCredential.findUnique({ where: { userId: link.userId } });
  if (!credential || (purpose === 'RESET_PASSWORD' && credential.version !== link.credentialVersion)) throw new Error('INVALID_LINK');
  const reset = purpose === 'RESET_PASSWORD';
  if (reset && (typeof passwordHash !== 'string' || !passwordHash.startsWith('scrypt$'))) throw new Error('INVALID_LINK');
  const locked = await tx.customerCredential.updateMany({ where: { userId: link.userId, passwordHash: credential.passwordHash, version: credential.version }, data: reset ? { passwordHash, version: { increment: 1 } } : { passwordHash: credential.passwordHash } });
  if (locked.count !== 1) throw new Error('INVALID_LINK');
  const user = await tx.user.findFirst({ where: { id: link.userId, email: link.email, role: 'CUSTOMER', disabledAt: null } });
  if (!user) throw new Error('INVALID_LINK');
  const consumed = await tx.customerEmailToken.deleteMany({ where: { tokenHash, purpose, expiresAt: { gt: new Date() } } });
  if (consumed.count !== 1) throw new Error('INVALID_LINK');
  if (reset) {
    await tx.customerEmailToken.deleteMany({ where: { userId: user.id, purpose: 'RESET_PASSWORD' } });
    await tx.session.deleteMany({ where: { userId: user.id } });
  } else {
    await tx.user.update({ where: { id: user.id }, data: { emailVerified: new Date() } });
    await tx.customerEmailToken.deleteMany({ where: { userId: user.id, purpose: 'VERIFY_EMAIL' } });
  }
}
