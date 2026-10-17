import { cookies } from 'next/headers';
import { prisma } from '../../../../lib/db';
import { consumeAuthAttempt, requireCustomer } from '../../../../lib/customer-session';
import { isSameOriginMutation } from '../../../../lib/catalog-management.mjs';
import { verifyCustomerPassword } from '../../../../lib/customer-password.mjs';
import { readJson } from '../../../../lib/http-json';
import { customerAccountsEnabled } from '../../../../lib/customer-accounts';
// @ts-ignore JavaScript module
import { SESSION_COOKIE } from '../../../../lib/session-policy.mjs';

export async function DELETE(request: Request) {
  if (!customerAccountsEnabled()) return Response.json({ error: 'NOT_FOUND' }, { status: 404 });
  try {
    const user = await requireCustomer();
    if (!isSameOriginMutation(request, process.env.APP_ORIGIN)) return Response.json({ error: 'FORBIDDEN' }, { status: 403 });
    const input = await readJson(request, 2048);
    if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).some(key => !['password', 'confirmation'].includes(key))) {
      return Response.json({ error: 'INVALID_REQUEST' }, { status: 400 });
    }
    const { password, confirmation } = input as { password?: unknown; confirmation?: unknown };
    if (typeof password !== 'string' || Buffer.byteLength(password, 'utf8') > 256 || confirmation !== 'SUPPRIMER') {
      return Response.json({ error: 'INVALID_REQUEST' }, { status: 400 });
    }

    const allowed = await prisma.$transaction(tx => consumeAuthAttempt(tx, user.email));
    if (!allowed) return Response.json({ error: 'TOO_MANY_ATTEMPTS' }, { status: 429, headers: { 'Retry-After': '900' } });
    const credential = await prisma.customerCredential.findUnique({ where: { userId: user.id } });
    if (!await verifyCustomerPassword(password, credential?.passwordHash) || !credential) return Response.json({ error: 'INVALID_PASSWORD' }, { status: 400 });

    await prisma.$transaction(async tx => {
      const activeOrder = await tx.order.findFirst({ where: { userId: user.id, OR: [
        { paymentStatus: { in: ['PENDING', 'REFUND_REQUIRED'] } },
        { status: { in: ['ACCEPTED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY'] } },
      ] }, select: { id: true } });
      if (activeOrder) throw new Error('ACTIVE_ORDERS');

      const [credits, reservations] = await Promise.all([
        tx.storeCreditEntry.aggregate({ where: { userId: user.id }, _sum: { amountCents: true } }),
        tx.storeCreditReservation.aggregate({ where: { userId: user.id, status: 'ACTIVE' }, _sum: { amountCents: true } }),
      ]);
      const balanceCents = (credits._sum.amountCents ?? 0) - (reservations._sum.amountCents ?? 0);
      if (balanceCents > 0 || (reservations._sum.amountCents ?? 0) > 0) throw new Error('STORE_CREDIT_REMAINS');

      const matched = await tx.customerCredential.deleteMany({ where: { userId: user.id, passwordHash: credential.passwordHash } });
      if (matched.count !== 1) throw new Error('ACCOUNT_CHANGED');

      // Keep the financial/order record, but detach it from the account and erase contact details.
      await tx.order.updateMany({ where: { userId: user.id }, data: {
        userId: null, guestEmail: null, contactName: null, phone: null, address: null, comment: null,
      } });
      const deleted = await tx.user.deleteMany({ where: { id: user.id, role: 'CUSTOMER', disabledAt: null } });
      if (deleted.count !== 1) throw new Error('ACCOUNT_CHANGED');
    });

    (await cookies()).delete(SESSION_COOKIE);
    return Response.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const code = error instanceof Error ? error.message : '';
    const status = code === 'UNAUTHORIZED' ? 401 : code === 'FORBIDDEN' ? 403 : code === 'ACTIVE_ORDERS' || code === 'STORE_CREDIT_REMAINS' || code === 'ACCOUNT_CHANGED' ? 409 : code === 'INVALID_REQUEST' ? 400 : 503;
    return Response.json({ error: status === 503 ? 'ACCOUNT_DELETE_UNAVAILABLE' : code }, { status, headers: { 'Cache-Control': 'no-store' } });
  }
}
