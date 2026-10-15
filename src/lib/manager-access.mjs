import { createSessionToken, hashSessionToken } from './session-token.mjs';
import { SESSION_TTL_SECONDS } from './session-policy.mjs';

/** Use only a database transaction: consuming a link and creating a session are atomic. */
export async function redeemManagerAccess(tx, token, now = new Date()) {
  let tokenHash;
  try { tokenHash = hashSessionToken(token); } catch { throw new Error('INVALID_ACCESS'); }
  const access = await tx.managerAccessToken.findUnique({ where: { tokenHash }, include: { user: true } });
  if (!access || access.expiresAt <= now || access.user.disabledAt || access.user.role !== 'MANAGER') throw new Error('INVALID_ACCESS');
  const consumed = await tx.managerAccessToken.deleteMany({ where: { tokenHash, expiresAt: { gt: now } } });
  if (consumed.count !== 1) throw new Error('INVALID_ACCESS');
  const session = createSessionToken();
  await tx.session.create({ data: { tokenHash: session.tokenHash, userId: access.userId, expiresAt: new Date(now.getTime() + SESSION_TTL_SECONDS * 1000) } });
  return session.token;
}
