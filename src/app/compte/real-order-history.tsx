import Link from 'next/link';
import type { CustomerRealOrders } from '../../lib/customer-real-orders';

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'En attente de paiement', ACCEPTED: 'Acceptée', PREPARING: 'En préparation',
  READY: 'Prête', OUT_FOR_DELIVERY: 'En livraison', COMPLETED: 'Terminée',
  REJECTED: 'Refusée', CANCELLED: 'Annulée',
};
const PAYMENT_LABELS: Record<string, string> = {
  PENDING: 'Paiement en attente', PAID: 'Payée', CREDITED: 'Payée par avoir', FAILED: 'Paiement échoué',
  REFUND_REQUIRED: 'Remboursement à traiter', REFUNDED: 'Remboursée',
};

export default function RealOrderHistory({ orders }: { orders: CustomerRealOrders }) {
  return <section aria-labelledby="real-order-history-title">
    <h2 id="real-order-history-title">Mes commandes</h2>
    {!orders.length ? <p>Vous n’avez pas encore de commande réelle.</p> : <ul className="customer-orders">
      {orders.map(order => <li key={order.id}>
        <Link href={`/compte/commandes/${order.id}`}>{order.publicReference}</Link>
        <p>{STATUS_LABELS[order.status] ?? order.status} · {PAYMENT_LABELS[order.paymentStatus] ?? order.paymentStatus}</p>
        <p>{order.fulfillment === 'DELIVERY' ? 'Livraison' : 'Retrait'} · {new Intl.NumberFormat('fr-BE', { style: 'currency', currency: order.currency }).format(order.totalCents / 100)}{order.creditAppliedCents > 0 ? ` · avoir utilisé ${new Intl.NumberFormat('fr-BE', { style: 'currency', currency: order.currency }).format(order.creditAppliedCents / 100)}` : ''} · {order.placedAt.toLocaleString('fr-BE', { timeZone: 'Europe/Brussels' })}</p>
      </li>)}
    </ul>}
  </section>;
}
