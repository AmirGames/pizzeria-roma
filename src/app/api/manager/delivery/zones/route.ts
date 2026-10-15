import { prisma } from '../../../../../lib/db';
import { requirePermission } from '../../../../../lib/auth';
import { isSameOriginMutation } from '../../../../../lib/catalog-management.mjs';
import { readJson } from '../../../../../lib/http-json';
// @ts-ignore JavaScript module; covered by unit tests
import { validateZoneUpdate } from '../../../../../lib/delivery-zones.mjs';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requirePermission('delivery:write');
    const zones = await prisma.deliveryZoneBoundary.findMany({ orderBy: { zoneId: 'asc' } });
    return Response.json({ zones }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const status = error instanceof Error && error.message === 'FORBIDDEN' ? 403 : 503;
    return Response.json({ error: status === 403 ? 'FORBIDDEN' : 'SERVICE_UNAVAILABLE' }, { status, headers: { 'Cache-Control': 'no-store' } });
  }
}

export async function PUT(request: Request) {
  try {
    await requirePermission('delivery:write');
    if (!isSameOriginMutation(request, process.env.APP_ORIGIN)) return Response.json({ error: 'FORBIDDEN' }, { status: 403 });
    const input = validateZoneUpdate(await readJson(request, 64_000));
    const current = await prisma.deliveryZoneBoundary.findUnique({ where: { zoneId: input.zoneId } });
    if ((current?.revision ?? 0) !== input.revision) return Response.json({ error: 'ZONE_CONFLICT' }, { status: 409 });
    let zone;
    if (current) {
      const changed = await prisma.deliveryZoneBoundary.updateMany({ where: { zoneId: input.zoneId, revision: input.revision }, data: { geometry: input.geometry, revision: { increment: 1 } } });
      if (changed.count !== 1) return Response.json({ error: 'ZONE_CONFLICT' }, { status: 409 });
      zone = await prisma.deliveryZoneBoundary.findUnique({ where: { zoneId: input.zoneId } });
    } else {
      zone = await prisma.deliveryZoneBoundary.create({ data: { zoneId: input.zoneId, geometry: input.geometry } });
    }
    return Response.json({ zone }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const code = error instanceof Error ? error.message : '';
    const status = code === 'FORBIDDEN' ? 403 : ['INVALID_DELIVERY_ZONE', 'INVALID_REQUEST'].includes(code) ? 400 : 503;
    return Response.json({ error: status === 403 ? 'FORBIDDEN' : status === 400 ? code : 'SERVICE_UNAVAILABLE' }, { status });
  }
}
