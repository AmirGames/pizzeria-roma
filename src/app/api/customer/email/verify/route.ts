import { prisma } from '../../../../../lib/db';
import { isSameOriginMutation } from '../../../../../lib/catalog-management.mjs';
import { redeemCustomerEmailToken } from '../../../../../lib/customer-email-links.mjs';
import { readJson } from '../../../../../lib/http-json';
import { customerAccountsEnabled } from '../../../../../lib/customer-accounts';
export async function POST(request: Request) {
  if (!customerAccountsEnabled()) return Response.json({ error: 'NOT_FOUND' }, { status: 404 });
  if (!isSameOriginMutation(request, process.env.APP_ORIGIN)) return Response.json({ error: 'FORBIDDEN' }, { status: 403 });
  try {
    const input = await readJson(request, 1024) as { token?: unknown };
    if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).length !== 1 || typeof input.token !== 'string') throw new Error('INVALID_LINK');
    await prisma.$transaction(tx => redeemCustomerEmailToken(tx, input.token, 'VERIFY_EMAIL'));
    return Response.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const invalid = error instanceof Error && ['INVALID_REQUEST', 'INVALID_LINK'].includes(error.message);
    return Response.json({ error: invalid ? 'INVALID_LINK' : 'SERVICE_UNAVAILABLE' }, { status: invalid ? 400 : 503 });
  }
}
