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
import { getSiteLocale } from '../../../../lib/locale';
import type { Metadata } from 'next';
// @ts-ignore JavaScript module
import { englishMenuTerm } from '../../../../lib/menu-translation.mjs';
const REAL_ORDER_STATUS_LABELS: Record<string, string> = { PENDING: 'En attente de paiement', ACCEPTED: 'Acceptée', PREPARING: 'En préparation', READY: 'Prête', OUT_FOR_DELIVERY: 'En livraison', COMPLETED: 'Terminée', REJECTED: 'Refusée', CANCELLED: 'Annulée' };
const REAL_PAYMENT_STATUS_LABELS: Record<string, string> = { PENDING: 'En attente', PAID: 'Payé', CREDITED: 'Payé par avoir', FAILED: 'Échoué', REFUND_REQUIRED: 'Remboursement à traiter', REFUNDED: 'Remboursé' };
export const dynamic = 'force-dynamic';
export async function generateMetadata(): Promise<Metadata> { const en = (await getSiteLocale()) === 'en'; return { title: `${en ? 'My order' : 'Ma commande'} | Pizzeria Roma`, robots: { index: false, follow: false } }; }
export default async function TestOrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const locale = await getSiteLocale();
  const en = locale === 'en';
  if (!testOrdersEnabled() && !realOrdersEnabled()) notFound();
  const user = await getCurrentUser();
  if (!user || user.role !== 'CUSTOMER') redirect('/compte');
  const { id } = await params;
  if (realOrdersEnabled()) {
    const order = await prisma.order.findFirst({ where: { id, userId: user.id }, include: { items: { orderBy: { id: 'asc' } } } });
    if (order) {
      const money = (cents: number) => new Intl.NumberFormat(en ? 'en-BE' : 'fr-BE', { style: 'currency', currency: order.currency }).format(cents / 100);
      const snapshot = Array.isArray(order.itemsSnapshot) ? order.itemsSnapshot as Array<{ label?: string; quantity?: number; totalCents?: number; loyaltyFreeQuantity?: number }> : [];
      const statusLabels: Record<string, string> = en ? { PENDING: 'Awaiting payment', ACCEPTED: 'Accepted', PREPARING: 'Preparing', READY: 'Ready', OUT_FOR_DELIVERY: 'Out for delivery', COMPLETED: 'Completed', REJECTED: 'Rejected', CANCELLED: 'Cancelled' } : REAL_ORDER_STATUS_LABELS;
      const paymentLabels: Record<string, string> = en ? { PENDING: 'Pending', PAID: 'Paid', CREDITED: 'Paid with store credit', FAILED: 'Failed', REFUND_REQUIRED: 'Refund to process', REFUNDED: 'Refunded' } : REAL_PAYMENT_STATUS_LABELS;
      return <main className="customer-page"><Link href="/compte">← {en ? 'My account' : 'Mon espace client'}</Link><h1>{en ? 'Order' : 'Commande'} {order.publicReference}</h1><p>{order.fulfillment === 'DELIVERY' ? (en ? 'Delivery' : 'Livraison') : (en ? 'Collection' : 'Retrait')} · {en ? 'placed' : 'passée le'} {order.placedAt.toLocaleString(en ? 'en-BE' : 'fr-BE', { timeZone: 'Europe/Brussels' })}</p><p>{en ? 'Preferred time' : 'Créneau souhaité'} : {order.scheduledFor ? order.scheduledFor.toLocaleString(en ? 'en-BE' : 'fr-BE', { timeZone: 'Europe/Brussels', dateStyle: 'full', timeStyle: 'short' }) : (en ? 'As soon as possible' : 'Dès que possible')}</p><h2>{en ? 'Status' : 'Suivi'} : {statusLabels[order.status] ?? order.status}</h2><p>{en ? 'Payment' : 'Paiement'} : {paymentLabels[order.paymentStatus] ?? order.paymentStatus}</p>{!['COMPLETED', 'REJECTED', 'CANCELLED'].includes(order.status) && order.paymentStatus !== 'REFUNDED' && order.paymentStatus !== 'FAILED' && <RefreshOrderStatus locale={locale} />}<ul>{snapshot.length ? snapshot.map((item, index) => <li key={index}>{item.quantity ?? 0} × {en ? englishMenuTerm(item.label ?? '') : item.label ?? 'Article'}{item.loyaltyFreeQuantity ? ` · ${item.loyaltyFreeQuantity} ${en ? 'free' : 'offert(s)'}` : ''} · {money(item.totalCents ?? 0)}</li>) : order.items.map(item => <li key={item.id}>{item.quantity} × {en ? englishMenuTerm(item.nameSnapshot) : item.nameSnapshot} · {money(item.unitPriceCents * item.quantity)}</li>)}</ul><p>{en ? 'Subtotal' : 'Sous-total'} : {money(order.subtotalCents)}</p>{order.loyaltyDiscountCents > 0 && <p>{en ? 'Loyalty card' : 'Carte fidélité'} : −{money(order.loyaltyDiscountCents)}</p>}{order.discountCents > 0 && <p>{order.promotionName ?? 'Promotion'} : −{money(order.discountCents)}</p>}<p><strong>{en ? 'Total' : 'Total'} : {money(order.totalCents)}</strong></p>{order.creditAppliedCents > 0 && <p>{en ? 'Store credit applied' : 'Avoir appliqué'} : {money(order.creditAppliedCents)}</p>}<p><strong>{en ? 'Paid online' : 'Payé en ligne'} : {money(order.totalCents - order.creditAppliedCents)}</strong></p>{order.fulfillment === 'DELIVERY' && order.address && <p>{en ? 'Delivery address' : 'Adresse de livraison'} : {order.address}</p>}{order.comment && <p>{en ? 'Your comment' : 'Votre commentaire'} : {order.comment}</p>}<Link href="/menu">{en ? 'Back to menu' : 'Retour à la carte'}</Link></main>;
    }
  }
  if (!testOrdersEnabled()) notFound();
  const order = await prisma.testOrder.findFirst({ where: { id, userId: user.id } });
  if (!order) notFound();
  return <main className="customer-page"><Link href="/compte">← {en ? 'My account' : 'Mon espace client'}</Link><h1>{en ? 'Test order saved' : 'Commande de test enregistrée'}</h1><p>{order.publicReference}</p><p>{en ? 'This is not a real order sent to the restaurant. The time slot is reserved in test mode only; there is no payment or actual preparation.' : 'Aucune commande réelle n’est envoyée au restaurant. Le créneau est réservé uniquement dans le mode test ; aucun paiement ni aucune préparation réelle n’a lieu.'}</p><p>{en ? 'Preferred time' : 'Créneau souhaité'} : {order.scheduledFor.toLocaleString(en ? 'en-BE' : 'fr-BE', { timeZone: 'Europe/Brussels', dateStyle: 'full', timeStyle: 'short' })}</p><h2>{en ? 'Status' : 'Suivi'} : {en ? ({ PENDING: 'Test saved', ACCEPTED: 'Test accepted', PREPARING: 'Simulated preparation', READY: 'Test ready', OUT_FOR_DELIVERY: 'Simulated delivery', COMPLETED: 'Test completed', REJECTED: 'Test rejected', CANCELLED: 'Test cancelled' } as Record<string, string>)[order.status] : TEST_STATUS_LABELS[order.status]}</h2><TestOrderActions id={order.id} revision={order.revision} statuses={order.status === 'PENDING' ? ['CANCELLED'] : []} customer locale={locale} /><TestOrderSummary items={order.itemsSnapshot as TestOrderSnapshot[]} subtotalCents={order.subtotalCents} loyaltyDiscountCents={order.loyaltyDiscountCents} discountCents={order.discountCents} promotionName={order.promotionName} promotionCode={order.promotionCode} totalCents={order.totalCents} locale={locale} /><CustomerReorder orderId={order.id} locale={locale} /><h2>{en ? 'Details for this test' : 'Coordonnées de cet essai'}</h2><p>{order.contactName} · {order.phone}</p><p>{order.fulfillment === 'DELIVERY' ? (en ? `Simulated delivery · ${order.address} · area ${order.zoneId}` : `Livraison simulée · ${order.address} · zone ${order.zoneId}`) : (en ? 'Simulated collection' : 'Retrait simulé sur place')}</p>{order.comment && <p>{en ? 'Comment' : 'Commentaire'} : {order.comment}</p>}<Link href="/menu">{en ? 'Back to menu' : 'Retour à la carte'}</Link></main>;
}
