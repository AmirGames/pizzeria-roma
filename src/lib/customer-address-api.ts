import { requireCustomer } from './customer-session';
import { isSameOriginMutation } from './catalog-management.mjs';
import { listCustomerAddresses, mutateCustomerAddress } from './customer-addresses';
import { readJson } from './http-json';
import { customerAccountsEnabled } from './customer-accounts';
export async function customerAddressRequest(request: Request, method: 'GET' | 'POST' | 'PATCH' | 'DELETE', id?: string) {
  if (!customerAccountsEnabled()) return Response.json({ error: 'NOT_FOUND' }, { status: 404 });
  try {
    const user = await requireCustomer();
    if (method !== 'GET' && !isSameOriginMutation(request, process.env.APP_ORIGIN)) return Response.json({ error: 'FORBIDDEN' }, { status: 403 });
    const addresses = method === 'GET' ? await listCustomerAddresses(user.id) : await mutateCustomerAddress(user.id, method, await readJson(request, 4096), id);
    return Response.json({ addresses }, { status: method === 'POST' ? 201 : 200, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const code = error instanceof Error ? error.message : '';
    const status = code === 'UNAUTHORIZED' ? 401 : code === 'ADDRESS_NOT_FOUND' ? 404 : ['ADDRESS_CONFLICT', 'ADDRESS_LIMIT'].includes(code) ? 409 : ['INVALID_ADDRESS', 'INVALID_REQUEST'].includes(code) ? 400 : 503;
    return Response.json({ error: status === 503 ? 'SERVICE_UNAVAILABLE' : code }, { status, headers: { 'Cache-Control': 'no-store' } });
  }
}
