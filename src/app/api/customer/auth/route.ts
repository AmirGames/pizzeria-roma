import { Prisma } from '@prisma/client';
import { prisma } from '../../../../lib/db';
import { isSameOriginMutation } from '../../../../lib/catalog-management.mjs';
import { validateCustomerAuth, hashCustomerPassword, verifyCustomerPassword } from '../../../../lib/customer-password.mjs';
import { consumeAuthAttempt, issueCustomerSession, issueVerifiedCustomerSession, setCustomerCookie } from '../../../../lib/customer-session';
import { testOrdersEnabled } from '../../../../lib/test-mode';

export async function POST(request: Request) {
  if (!testOrdersEnabled()) return Response.json({ error: 'NOT_FOUND' }, { status: 404 });
  if (!isSameOriginMutation(request, process.env.APP_ORIGIN)) return Response.json({ error: 'FORBIDDEN' }, { status: 403 });
  try {
    const raw = await request.text();
    if (raw.length > 4096) return Response.json({ error: 'INVALID_AUTH' }, { status: 400 });
    let input;
    try { input = validateCustomerAuth(JSON.parse(raw)); } catch { return Response.json({ error: 'INVALID_AUTH' }, { status: 400 }); }
    const allowed = await prisma.$transaction(tx => consumeAuthAttempt(tx, input.email));
    if (!allowed) return Response.json({ error: 'TOO_MANY_ATTEMPTS' }, { status: 429, headers: { 'Retry-After': '900' } });
    let token: string;
    if (input.action === 'register') {
      const passwordHash = await hashCustomerPassword(input.password);
      token = await prisma.$transaction(async tx => {
        const user = await tx.user.create({ data: { email: input.email, name: input.name, role: 'CUSTOMER', customerCredential: { create: { passwordHash } } } });
        return issueCustomerSession(tx, user.id);
      });
    } else {
      const user = await prisma.user.findUnique({ where: { email: input.email }, include: { customerCredential: true } });
      const valid = await verifyCustomerPassword(input.password, user?.customerCredential?.passwordHash);
      if (!valid || !user || user.disabledAt || user.role !== 'CUSTOMER') return Response.json({ error: 'INVALID_AUTH' }, { status: 401 });
      token = await prisma.$transaction(tx => issueVerifiedCustomerSession(tx, user.id, user.customerCredential!.passwordHash));
    }
    await setCustomerCookie(token);
    return Response.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error instanceof Error && error.message === 'INVALID_AUTH') return Response.json({ error: 'INVALID_AUTH' }, { status: 401 });
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') return Response.json({ error: 'INVALID_AUTH' }, { status: 400 });
    return Response.json({ error: 'SERVICE_UNAVAILABLE' }, { status: 503 });
  }
}
