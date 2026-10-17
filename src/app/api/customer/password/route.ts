import { prisma } from '../../../../lib/db';
import { consumeAuthAttempt, issueCustomerSession, requireCustomer, setCustomerCookie } from '../../../../lib/customer-session';
import { isSameOriginMutation } from '../../../../lib/catalog-management.mjs';
import { validatePasswordChange } from '../../../../lib/customer-profile.mjs';
import { hashCustomerPassword, verifyCustomerPassword } from '../../../../lib/customer-password.mjs';
import { readJson } from '../../../../lib/http-json';
import { customerAccountsEnabled } from '../../../../lib/customer-accounts';
export async function POST(request: Request) {
  if (!customerAccountsEnabled()) return Response.json({ error: 'NOT_FOUND' }, { status: 404 });
  try {
    const user = await requireCustomer();
    if (!isSameOriginMutation(request, process.env.APP_ORIGIN)) return Response.json({ error: 'FORBIDDEN' }, { status: 403 });
    const input = validatePasswordChange(await readJson(request, 4096));
    const allowed = await prisma.$transaction(tx => consumeAuthAttempt(tx, user.email));
    if (!allowed) return Response.json({ error: 'TOO_MANY_ATTEMPTS' }, { status: 429, headers: { 'Retry-After': '900' } });
    const credential = await prisma.customerCredential.findUnique({ where: { userId: user.id } });
    if (!await verifyCustomerPassword(input.currentPassword, credential?.passwordHash) || !credential) return Response.json({ error: 'INVALID_PASSWORD' }, { status: 400 });
    const passwordHash = await hashCustomerPassword(input.newPassword);
    const token = await prisma.$transaction(async tx => {
      const updated = await tx.customerCredential.updateMany({ where: { userId: user.id, passwordHash: credential.passwordHash }, data: { passwordHash, version: { increment: 1 } } });
      const current = await tx.user.findFirst({ where: { id: user.id, role: 'CUSTOMER', disabledAt: null } });
      if (updated.count !== 1 || !current) throw new Error('PASSWORD_CONFLICT');
      await tx.customerEmailToken.deleteMany({ where: { userId: user.id, purpose: 'RESET_PASSWORD' } });
      await tx.session.deleteMany({ where: { userId: user.id } });
      return issueCustomerSession(tx, user.id);
    });
    await setCustomerCookie(token);
    return Response.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const code = error instanceof Error ? error.message : '';
    const status = code === 'UNAUTHORIZED' ? 401 : code === 'PASSWORD_CONFLICT' ? 409 : ['INVALID_PROFILE', 'INVALID_REQUEST'].includes(code) ? 400 : 503;
    return Response.json({ error: status === 503 ? 'UPDATE_FAILED' : code }, { status });
  }
}
