import { createHash } from 'node:crypto';
import { prisma } from '../../../../../lib/db';
import { consumeAuthAttempt } from '../../../../../lib/customer-session';
import { isSameOriginMutation } from '../../../../../lib/catalog-management.mjs';
import { redeemCustomerEmailToken } from '../../../../../lib/customer-email-links.mjs';
import { readJson } from '../../../../../lib/http-json';
import { testOrdersEnabled } from '../../../../../lib/test-mode';

export async function POST(request: Request) {
  if (!testOrdersEnabled()) return Response.json({ error: 'NOT_FOUND' }, { status: 404 });
  if (!isSameOriginMutation(request, process.env.APP_ORIGIN)) return Response.json({ error: 'FORBIDDEN' }, { status: 403 });
  try {
    const input = await readJson(request, 1024) as { token?: unknown };
    if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).length !== 1 || typeof input.token !== 'string') throw new Error('INVALID_LINK');
    const tokenHash = createHash('sha256').update(input.token).digest('hex');
    const link = await prisma.customerEmailToken.findUnique({ where: { tokenHash } });
    if (!link || link.purpose !== 'CHANGE_EMAIL' || link.expiresAt <= new Date()) throw new Error('INVALID_LINK');
    if (!await prisma.$transaction(tx => consumeAuthAttempt(tx, `email-change:${tokenHash}`))) return Response.json({ error: 'TOO_MANY_ATTEMPTS' }, { status: 429, headers: { 'Retry-After': '900', 'Cache-Control': 'no-store' } });
    await prisma.$transaction(tx => redeemCustomerEmailToken(tx, input.token as string, 'CHANGE_EMAIL'));
    return Response.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const code = error instanceof Error ? error.message : '';
    const status = code === 'EMAIL_IN_USE' ? 409 : code === 'INVALID_LINK' || code === 'INVALID_REQUEST' ? 400 : 503;
    return Response.json({ error: status === 503 ? 'CHANGE_UNAVAILABLE' : status === 409 ? 'EMAIL_IN_USE' : 'INVALID_LINK' }, { status, headers: { 'Cache-Control': 'no-store' } });
  }
}
