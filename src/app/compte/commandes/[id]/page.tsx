import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '../../../../lib/auth';
import { prisma } from '../../../../lib/db';
import { testOrdersEnabled } from '../../../../lib/test-mode';
import { realOrdersEnabled } from '../../../../lib/real-orders';
import { TEST_STATUS_LABELS } from '../../../../lib/test-order-policy.mjs';
import type { TestOrderSnapshot } from '../../../../lib/test-order-policy.mjs';
import TestOrderSummary from '../../../../components/test-order-summary';
import TestOrderActions from '../../../../components/test-order-actions';
import CustomerReorder from '../../../../components/customer-reorder';
import RefreshOrderStatus from './refresh-order-status';
const REAL_ORDER_STATUS_LABELS: Record<string, string> = { PENDING: 'En attente de paiement', ACCEPTED: 'Acceptée', PREPARING: 'En préparation', READY: 'Prête', OUT_FOR_DELIVERY: 'En livraison', COMPLETED: 'Terminée', REJECTED: 'Refusée', CANCELLED: 'Annulée' };
const REAL_PAYMENT_STATUS_LABELS: Record<string, string> = { PENDING: 'En attente', PAID: 'Payé', CREDITED: 'Payé par avoir', FAILED: 'Échoué', REFUND_REQUIRED: 'Remboursement à traiter', REFUNDED: 'Remboursé' };
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Ma commande | Pizzeria Roma', robots: { index: false, follow: false } };
export default async function TestOrderDetail({ params }: { params: Promise<{ id: string }> }) {
  if (!testOrdersEnabled() && !realOrdersEnabled()) notFound();
  const user = await getCurrentUser();
  if (!user || user.role !== 'CUSTOMER') redirect('/compte');
  const { id } = await params;
  if (realOrdersEnabled()) {
    const order = await prisma.order.findFirst({ where: { id, userId: user.id }, include: { items: { orderBy: { id: 'asc' } } } });
    if (order) {
      const money = (cents: number) => new Intl.NumberFormat('fr-BE', { style: 'currency', currency: order.currency }).format(cents / 100);
      const snapshot = Array.isArray(order.itemsSnapshot) ? order.itemsSnapshot as Array<{ label?: string; quantity?: number; totalCents?: number; loyaltyFreeQuantity?: number }> : [];
      return <main className="customer-page"><Link href="/compte">← Mon espace client</Link><h1>Commande {order.publicReference}</h1><p>{order.fulfillment === 'DELIVERY' ? 'Livraison' : 'Retrait'} · passée le {order.placedAt.toLocaleString('fr-BE', { timeZone: 'Europe/Brussels' })}</p><p>Créneau souhaité : {order.scheduledFor ? order.scheduledFor.toLocaleString('fr-BE', { timeZone: 'Europe/Brussels', dateStyle: 'full', timeStyle: 'short' }) : 'Dès que possible'}</p><h2>Suivi : {REAL_ORDER_STATUS_LABELS[order.status] ?? order.status}</h2><p>Paiement : {REAL_PAYMENT_STATUS_LABELS[order.paymentStatus] ?? order.paymentStatus}</p>{!['COMPLETED', 'REJECTED', 'CANCELLED'].includes(order.status) && order.paymentStatus !== 'REFUNDED' && order.paymentStatus !== 'FAILED' && <RefreshOrderStatus />}<ul>{snapshot.length ? snapshot.map((item, index) => <li key={index}>{item.quantity ?? 0} × {item.label ?? 'Article'}{item.loyaltyFreeQuantity ? ` · ${item.loyaltyFreeQuantity} offert(s)` : ''} · {money(item.totalCents ?? 0)}</li>) : order.items.map(item => <li key={item.id}>{item.quantity} × {item.nameSnapshot} · {money(item.unitPriceCents * item.quantity)}</li>)}</ul><p>Sous-total : {money(order.subtotalCents)}</p>{order.loyaltyDiscountCents > 0 && <p>Carte fidélité : −{money(order.loyaltyDiscountCents)}</p>}{order.discountCents > 0 && <p>{order.promotionName ?? 'Promotion'} : −{money(order.discountCents)}</p>}<p><strong>Total : {money(order.totalCents)}</strong></p>{order.creditAppliedCents > 0 && <p>Avoir appliqué : {money(order.creditAppliedCents)}</p>}<p><strong>Payé en ligne : {money(order.totalCents - order.creditAppliedCents)}</strong></p>{order.fulfillment === 'DELIVERY' && order.address && <p>Adresse de livraison : {order.address}</p>}{order.comment && <p>Votre commentaire : {order.comment}</p>}<Link href="/menu">Retour à la carte</Link></main>;
    }
  }
  if (!testOrdersEnabled()) notFound();
  const order = await prisma.testOrder.findFirst({ where: { id, userId: user.id } });
  if (!order) notFound();
  return <main className="customer-page"><Link href="/compte">← Mon espace client</Link><h1>Commande de test enregistrée</h1><p>{order.publicReference}</p><p>Aucune commande réelle n’est envoyée au restaurant. Le créneau est réservé uniquement dans le mode test ; aucun paiement ni aucune préparation réelle n’a lieu.</p><p>Créneau souhaité : {order.scheduledFor.toLocaleString('fr-BE', { timeZone: 'Europe/Brussels', dateStyle: 'full', timeStyle: 'short' })}</p><h2>Suivi : {TEST_STATUS_LABELS[order.status]}</h2><TestOrderActions id={order.id} revision={order.revision} statuses={order.status === 'PENDING' ? ['CANCELLED'] : []} customer /><TestOrderSummary items={order.itemsSnapshot as TestOrderSnapshot[]} subtotalCents={order.subtotalCents} loyaltyDiscountCents={order.loyaltyDiscountCents} discountCents={order.discountCents} promotionName={order.promotionName} promotionCode={order.promotionCode} totalCents={order.totalCents} /><CustomerReorder orderId={order.id} /><h2>Coordonnées de cet essai</h2><p>{order.contactName} · {order.phone}</p><p>{order.fulfillment === 'DELIVERY' ? `Livraison simulée · ${order.address} · zone ${order.zoneId}` : 'Retrait simulé sur place'}</p>{order.comment && <p>Commentaire : {order.comment}</p>}<Link href="/menu">Retour à la carte</Link></main>;
}
