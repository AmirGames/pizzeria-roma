import { requireCustomer } from '../../../../lib/customer-session';
import { testOrdersEnabled } from '../../../../lib/test-mode';
import { resolveWalloniaDeliveryAddress } from '../../../../lib/wallonia-delivery';
import { readJson } from '../../../../lib/http-json';

export async function POST(request: Request) {
  if (!testOrdersEnabled()) return Response.json({ error: 'NOT_FOUND' }, { status: 404 });
  try {
    await requireCustomer();
    const input = await readJson(request, 1024) as { address?: unknown };
    if (!input || typeof input !== 'object' || Object.keys(input).some(key => key !== 'address') || typeof input.address !== 'string' || input.address.trim().length < 5 || input.address.trim().length > 300) {
      return Response.json({ error: 'INVALID_ADDRESS' }, { status: 400 });
    }
    const resolved = await resolveWalloniaDeliveryAddress(input.address.trim());
    return Response.json(resolved, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const code = error instanceof Error ? error.message : '';
    const status = code === 'UNAUTHORIZED' ? 401 : code === 'ADDRESS_NOT_FOUND' || code === 'ADDRESS_OUTSIDE_DELIVERY' ? 422 : code === 'ZONES_NOT_CONFIGURED' ? 503 : code === 'INVALID_REQUEST' ? 400 : 503;
    return Response.json({ error: status === 503 ? code || 'SERVICE_UNAVAILABLE' : code }, { status, headers: { 'Cache-Control': 'no-store' } });
  }
}
