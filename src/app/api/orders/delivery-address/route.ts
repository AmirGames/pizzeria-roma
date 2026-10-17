import { realOrdersEnabled } from '../../../../lib/real-orders';
import { resolveWalloniaDeliveryAddress } from '../../../../lib/wallonia-delivery';
import { readJson } from '../../../../lib/http-json';

export async function POST(request: Request) {
  if (!realOrdersEnabled()) return Response.json({ error: 'NOT_FOUND' }, { status: 404 });
  try {
    const input = await readJson(request, 1024) as { address?: unknown };
    if (!input || typeof input !== 'object' || Object.keys(input).some(key => key !== 'address') || typeof input.address !== 'string' || input.address.trim().length < 5 || input.address.trim().length > 300) return Response.json({ error: 'INVALID_ADDRESS' }, { status: 400 });
    return Response.json(await resolveWalloniaDeliveryAddress(input.address.trim()), { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const code = error instanceof Error ? error.message : '';
    const status = ['ADDRESS_NOT_FOUND','ADDRESS_OUTSIDE_DELIVERY'].includes(code) ? 422 : code === 'INVALID_REQUEST' ? 400 : 503;
    return Response.json({ error: status === 503 ? code || 'SERVICE_UNAVAILABLE' : code }, { status, headers: { 'Cache-Control': 'no-store' } });
  }
}
