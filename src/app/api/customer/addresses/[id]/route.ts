import { customerAddressRequest } from '../../../../../lib/customer-address-api';
type Context = { params: Promise<{ id: string }> };
export async function PATCH(request: Request, context: Context) { return customerAddressRequest(request, 'PATCH', (await context.params).id); }
export async function DELETE(request: Request, context: Context) { return customerAddressRequest(request, 'DELETE', (await context.params).id); }
