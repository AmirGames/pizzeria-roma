import 'server-only';
import { cookies } from 'next/headers';
import type { Prisma } from '@prisma/client';
import { createHash } from 'node:crypto';
import { getCurrentUser } from './auth';
// @ts-ignore JavaScript module; covered by unit tests
import { createSessionToken, hashSessionToken } from './session-token.mjs';
// @ts-ignore JavaScript module; covered by unit tests
import { SESSION_COOKIE, SESSION_COOKIE_OPTIONS, SESSION_TTL_SECONDS } from './session-policy.mjs';

export async function requireCustomer() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'CUSTOMER') throw new Error('UNAUTHORIZED');
  return user;
}
export async function issueCustomerSession(tx: Prisma.TransactionClient, userId: string) {
  const oldToken = (await cookies()).get(SESSION_COOKIE)?.value;
  if (oldToken) {
    try { await tx.session.deleteMany({ where: { tokenHash: hashSessionToken(oldToken) } }); }
    catch (error) { if (!(error instanceof TypeError)) throw error; }
  }
  const session = createSessionToken();
  await tx.session.create({ data: { tokenHash: session.tokenHash, userId, expiresAt: new Date(Date.now() + SESSION_TTL_SECONDS * 1000) } });
  return session.token as string;
}
export async function setCustomerCookie(token: string) {
  (await cookies()).set(SESSION_COOKIE, token, { ...SESSION_COOKIE_OPTIONS, secure: process.env.NODE_ENV !== 'development' });
}
export async function consumeAuthAttempt(tx: Prisma.TransactionClient, email: string) {
  const now = new Date();
  for (const [scope, limit] of [['global', 100], [email, 10]] as const) {
    const key = createHash('sha256').update(`customer-auth:${scope}`).digest('hex');
    let record = await tx.authThrottle.upsert({ where: { key }, create: { key, attempts: 1, windowStart: now }, update: { attempts: { increment: 1 } } });
    if (record.windowStart.getTime() <= now.getTime() - 15 * 60 * 1000) record = await tx.authThrottle.update({ where: { key }, data: { attempts: 1, windowStart: now } });
    if (record.attempts > limit) return false;
  }
  return true;
}

/** Lock the verified credential until the new session is committed. A concurrent
 * password rotation either revokes this session afterwards or invalidates the hash. */
export async function issueVerifiedCustomerSession(tx: Prisma.TransactionClient, userId: string, verifiedHash: string) {
  const matched = await tx.customerCredential.updateMany({ where: { userId, passwordHash: verifiedHash }, data: { passwordHash: verifiedHash } });
  const current = await tx.user.findFirst({ where: { id: userId, role: 'CUSTOMER', disabledAt: null } });
  if (matched.count !== 1 || !current) throw new Error('INVALID_AUTH');
  return issueCustomerSession(tx, userId);
}
