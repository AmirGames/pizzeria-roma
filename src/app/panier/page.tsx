import CartPageClient from './cart-client';
import { realOrdersEnabled } from '../../lib/real-orders';

export const dynamic = 'force-dynamic';
export default function CartPage() { return <CartPageClient realOrdersEnabled={realOrdersEnabled()} />; }
