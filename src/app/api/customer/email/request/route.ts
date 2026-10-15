import { prisma } from '../../../../../lib/db';
import { consumeAuthAttempt, requireCustomer } from '../../../../../lib/customer-session';
import { isSameOriginMutation } from '../../../../../lib/catalog-management.mjs';
import { normalizeRecoveryEmail, localMailOrigin, emailLinkOrigin } from '../../../../../lib/customer-email-links.mjs';
import { localCustomerMailConfigured, sendCustomerLink } from '../../../../../lib/local-customer-mail';
import { readJson } from '../../../../../lib/http-json';
import { testOrdersEnabled } from '../../../../../lib/test-mode';
export async function POST(request: Request) {
  if (!testOrdersEnabled()) return Response.json({ error: 'NOT_FOUND' }, { status: 404 });
  if (!isSameOriginMutation(request, process.env.APP_ORIGIN)) return Response.json({ error: 'FORBIDDEN' }, { status: 403 });
  try {
    const input = await readJson(request, 4096) as { action?: string; email?: unknown };
    if (!input || typeof input !== 'object' || Array.isArray(input) || !['verify', 'reset'].includes(input.action ?? '') || Object.keys(input).some(key => !['action', ...(input.action === 'reset' ? ['email'] : [])].includes(key))) throw new Error('INVALID_REQUEST');
    const current = input.action === 'verify' ? await requireCustomer() : null;
    const email = current?.email ?? normalizeRecoveryEmail(input.email);
    if (!localCustomerMailConfigured()) throw new Error('MAIL_UNAVAILABLE');
    localMailOrigin(process.env.LOCAL_MAIL_URL); emailLinkOrigin(process.env.APP_ORIGIN);
    if (!await prisma.$transaction(tx => consumeAuthAttempt(tx, email))) return Response.json({ error: 'TOO_MANY_ATTEMPTS' }, { status: 429, headers: { 'Retry-After': '900' } });
    if (current) await sendCustomerLink(current.id, 'VERIFY_EMAIL');
    else {
      const user = await prisma.user.findFirst({ where: { email, role: 'CUSTOMER', disabledAt: null, customerCredential: { isNot: null } } });
      // Mail delivery failures must not reveal whether this account exists.
      if (user) { try { await sendCustomerLink(user.id, 'RESET_PASSWORD'); } catch { /* Same generic response as for an unknown address. */ } }
    }
    return Response.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const code = error instanceof Error ? error.message : '';
    return Response.json({ error: code === 'UNAUTHORIZED' ? code : code === 'INVALID_REQUEST' ? code : 'MAIL_UNAVAILABLE' }, { status: code === 'UNAUTHORIZED' ? 401 : code === 'INVALID_REQUEST' ? 400 : 503 });
  }
}
