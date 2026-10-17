import { createHash } from 'node:crypto';
import { prisma } from '../../../../../lib/db';
import { consumeAuthAttempt } from '../../../../../lib/customer-session';
import { isSameOriginMutation } from '../../../../../lib/catalog-management.mjs';
import { redeemCustomerEmailToken } from '../../../../../lib/customer-email-links.mjs';
import { validatePasswordReset } from '../../../../../lib/customer-profile.mjs';
import { hashCustomerPassword } from '../../../../../lib/customer-password.mjs';
import { readJson } from '../../../../../lib/http-json';
import { customerAccountsEnabled } from '../../../../../lib/customer-accounts';
export async function POST(request: Request) {
  if (!customerAccountsEnabled()) return Response.json({ error: 'NOT_FOUND' }, { status: 404 });
  if (!isSameOriginMutation(request, process.env.APP_ORIGIN)) return Response.json({ error: 'FORBIDDEN' }, { status: 403 });
  try {
    const input = validatePasswordReset(await readJson(request, 4096));
    const tokenHash = createHash('sha256').update(input.token).digest('hex');
    const link = await prisma.customerEmailToken.findUnique({ where: { tokenHash } });
    if (!link || link.purpose !== 'RESET_PASSWORD' || link.expiresAt <= new Date()) throw new Error('INVALID_LINK');
    if (!await prisma.$transaction(tx => consumeAuthAttempt(tx, `reset:${tokenHash}`))) return Response.json({ error: 'TOO_MANY_ATTEMPTS' }, { status: 429, headers: { 'Retry-After': '900' } });
    const passwordHash = await hashCustomerPassword(input.newPassword);
    await prisma.$transaction(tx => redeemCustomerEmailToken(tx, input.token, 'RESET_PASSWORD', passwordHash));
    return Response.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const invalid = error instanceof Error && ['INVALID_REQUEST', 'INVALID_PROFILE', 'INVALID_LINK'].includes(error.message);
    return Response.json({ error: invalid ? 'INVALID_LINK' : 'SERVICE_UNAVAILABLE' }, { status: invalid ? 400 : 503 });
  }
}
