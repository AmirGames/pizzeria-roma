import Link from 'next/link';
import type { CustomerRealOrders } from '../../lib/customer-real-orders';
import type { SiteLocale } from '../../lib/locale';

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'En attente de paiement', ACCEPTED: 'Acceptée', PREPARING: 'En préparation',
  READY: 'Prête', OUT_FOR_DELIVERY: 'En livraison', COMPLETED: 'Terminée',
  REJECTED: 'Refusée', CANCELLED: 'Annulée',
};
const PAYMENT_LABELS: Record<string, string> = {
  PENDING: 'Paiement en attente', PAID: 'Payée', CREDITED: 'Payée par avoir', FAILED: 'Paiement échoué',
  REFUND_REQUIRED: 'Remboursement à traiter', REFUNDED: 'Remboursée',
};

export default function RealOrderHistory({ orders, locale = 'fr' }: { orders: CustomerRealOrders; locale?: SiteLocale }) {
  const en = locale === 'en';
  const statusLabels: Record<string, string> = en ? { PENDING: 'Awaiting payment', ACCEPTED: 'Accepted', PREPARING: 'Preparing', READY: 'Ready', OUT_FOR_DELIVERY: 'Out for delivery', COMPLETED: 'Completed', REJECTED: 'Rejected', CANCELLED: 'Cancelled' } : STATUS_LABELS;
  const paymentLabels: Record<string, string> = en ? { PENDING: 'Payment pending', PAID: 'Paid', CREDITED: 'Paid with store credit', FAILED: 'Payment failed', REFUND_REQUIRED: 'Refund to process', REFUNDED: 'Refunded' } : PAYMENT_LABELS;
  const money = (cents: number, currency: string) => new Intl.NumberFormat(en ? 'en-BE' : 'fr-BE', { style: 'currency', currency }).format(cents / 100);
  return <section aria-labelledby="real-order-history-title">
    <h2 id="real-order-history-title">{en ? 'My real orders' : 'Mes commandes'}</h2>
    {!orders.length ? <p>{en ? 'You do not have any real orders yet.' : 'Vous n’avez pas encore de commande réelle.'}</p> : <ul className="customer-orders">
      {orders.map(order => <li key={order.id}>
        <Link href={`/compte/commandes/${order.id}`}>{order.publicReference}</Link>
        <p>{statusLabels[order.status] ?? order.status} · {paymentLabels[order.paymentStatus] ?? order.paymentStatus}</p>
        <p>{order.fulfillment === 'DELIVERY' ? (en ? 'Delivery' : 'Livraison') : (en ? 'Collection' : 'Retrait')} · {money(order.totalCents, order.currency)}{order.creditAppliedCents > 0 ? ` · ${en ? 'store credit used' : 'avoir utilisé'} ${money(order.creditAppliedCents, order.currency)}` : ''} · {order.placedAt.toLocaleString(en ? 'en-BE' : 'fr-BE', { timeZone: 'Europe/Brussels' })}</p>
      </li>)}
    </ul>}
  </section>;
}
