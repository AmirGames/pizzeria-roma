import { customerAddressRequest } from '../../../../lib/customer-address-api';
export function GET(request: Request) { return customerAddressRequest(request, 'GET'); }
export function POST(request: Request) { return customerAddressRequest(request, 'POST'); }
