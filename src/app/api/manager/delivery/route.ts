import { prisma } from '../../../../lib/db';
import { requirePermission } from '../../../../lib/auth';
import { isSameOriginMutation } from '../../../../lib/catalog-management.mjs';
import { readJson } from '../../../../lib/http-json';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requirePermission('delivery:write');
    const config = await prisma.deliveryConfiguration.findUnique({ where: { id: 'global' } });
    return Response.json({ config }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const status = error instanceof Error && error.message === 'FORBIDDEN' ? 403 : 503;
    return Response.json({ error: status === 403 ? 'FORBIDDEN' : 'SERVICE_UNAVAILABLE' }, { status, headers: { 'Cache-Control': 'no-store' } });
  }
}

export async function PUT(request: Request) {
  try {
    await requirePermission('delivery:write');
    if (!isSameOriginMutation(request, process.env.APP_ORIGIN)) return Response.json({ error: 'FORBIDDEN' }, { status: 403 });
    const input = await readJson(request, 2048) as { pickupLeadMinutes?: unknown; slotPizzaCapacity?: unknown; revision?: unknown };
    if (!input || typeof input !== 'object' || Object.keys(input).some(key => !['pickupLeadMinutes', 'slotPizzaCapacity', 'revision'].includes(key)) ||
        !Number.isSafeInteger(input.pickupLeadMinutes) || (input.pickupLeadMinutes as number) < 15 || (input.pickupLeadMinutes as number) > 240 || (input.pickupLeadMinutes as number) % 15 !== 0 ||
        !Number.isSafeInteger(input.slotPizzaCapacity) || (input.slotPizzaCapacity as number) < 1 || (input.slotPizzaCapacity as number) > 70 ||
        !Number.isSafeInteger(input.revision) || (input.revision as number) < 0) return Response.json({ error: 'INVALID_SETTINGS' }, { status: 400 });
    const current = await prisma.deliveryConfiguration.findUnique({ where: { id: 'global' } });
    if (!current || current.revision !== input.revision) return Response.json({ error: 'SETTINGS_CONFLICT' }, { status: 409 });
    const changed = await prisma.deliveryConfiguration.updateMany({ where: { id: 'global', revision: input.revision as number }, data: {
      pickupLeadMinutes: input.pickupLeadMinutes as number,
      slotPizzaCapacity: input.slotPizzaCapacity as number,
      revision: { increment: 1 },
    } });
    if (changed.count !== 1) return Response.json({ error: 'SETTINGS_CONFLICT' }, { status: 409 });
    const config = await prisma.deliveryConfiguration.findUnique({ where: { id: 'global' } });
    return Response.json({ config }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const code = error instanceof Error ? error.message : '';
    const status = code === 'FORBIDDEN' ? 403 : code === 'INVALID_REQUEST' ? 400 : 503;
    return Response.json({ error: status === 403 ? 'FORBIDDEN' : status === 400 ? 'INVALID_REQUEST' : 'SERVICE_UNAVAILABLE' }, { status });
  }
}
