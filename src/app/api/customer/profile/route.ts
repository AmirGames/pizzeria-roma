import { prisma } from '../../../../lib/db';
import { requireCustomer } from '../../../../lib/customer-session';
import { isSameOriginMutation } from '../../../../lib/catalog-management.mjs';
import { validateCustomerProfile } from '../../../../lib/customer-profile.mjs';
import { readJson } from '../../../../lib/http-json';
import { testOrdersEnabled } from '../../../../lib/test-mode';
export async function PATCH(request: Request) {
  if (!testOrdersEnabled()) return Response.json({ error: 'NOT_FOUND' }, { status: 404 });
  try {
    const user = await requireCustomer();
    if (!isSameOriginMutation(request, process.env.APP_ORIGIN)) return Response.json({ error: 'FORBIDDEN' }, { status: 403 });
    const input = validateCustomerProfile(await readJson(request, 4096));
    const result = await prisma.user.updateMany({ where: { id: user.id, role: 'CUSTOMER', disabledAt: null }, data: input });
    if (result.count !== 1) return Response.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    return Response.json(input, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const code = error instanceof Error ? error.message : '';
    return Response.json({ error: code === 'UNAUTHORIZED' ? code : 'UPDATE_FAILED' }, { status: code === 'UNAUTHORIZED' ? 401 : ['INVALID_PROFILE', 'INVALID_REQUEST'].includes(code) ? 400 : 503 });
  }
}
