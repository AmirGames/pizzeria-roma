import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '../../../lib/db';
import { requirePermission } from '../../../lib/auth';
import { realOrdersEnabled, nextRealOrderStatuses, stripeReady } from '../../../lib/real-orders';
import RealOrderActions from '../../../components/real-order-actions';
import RefreshRealOrders from '../../../components/refresh-real-orders';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Commandes réelles | Pizzeria Roma', robots: { index: false, follow: false } };
const labels: Record<string, string> = { ACCEPTED: 'À préparer', PREPARING: 'En préparation', READY: 'Prête', OUT_FOR_DELIVERY: 'En livraison', COMPLETED: 'Terminée', CANCELLED: 'Annulée' };
const money = (cents: number) => new Intl.NumberFormat('fr-BE', { style: 'currency', currency: 'EUR' }).format(cents / 100);

export default async function RealOrderQueue() {
  if (!realOrdersEnabled()) notFound();
  let staff: Awaited<ReturnType<typeof requirePermission>>;
  try { staff = await requirePermission('orders:read'); }
  catch (error) {
    if (!(error instanceof Error) || error.message !== 'FORBIDDEN') throw error;
    return <main className="manager-page"><h1>Accès professionnel requis</h1><Link className="manager-button-link" href="/gerant/connexion">Connexion gérant</Link></main>;
  }
  const orders = await prisma.order.findMany({
    where: { paymentStatus: { in: ['PAID', 'CREDITED'] }, status: { in: ['ACCEPTED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY'] } },
    orderBy: [{ scheduledFor: 'asc' }, { placedAt: 'asc' }], take: 100,
  });
  const isManager = staff.role === 'MANAGER';
  return <main className="manager-page">
    <p className="manager-eyebrow">OPÉRATIONS · COMMANDES PAYÉES</p>
    <h1>File cuisine et commandes</h1>
    {isManager && <p><Link href="/gerant/remboursements">Suivre les remboursements en attente</Link></p>}
    <div className="manager-notice"><strong>Commandes encaissées</strong><span>Les changements de statut sont enregistrés dans le suivi. Les tickets sont prévus pour un rouleau de 80 mm : dans la boîte d’impression, choisissez ce format, une échelle de 100 % et désactivez les en-têtes et pieds de page.</span></div>
    <RefreshRealOrders />
    <section className="manager-orders-panel">
      <h2>À traiter ({orders.length})</h2>
      {!orders.length ? <p>Aucune commande payée à traiter.</p> : orders.map(order => {
        const items = Array.isArray(order.itemsSnapshot) ? order.itemsSnapshot as Array<{ label?: string; quantity?: number; loyaltyFreeQuantity?: number }> : [];
        const amountPaidOnline = order.totalCents - order.creditAppliedCents;
        return <article className="real-order-card" id={`real-order-${order.id}`} key={order.id} aria-labelledby={`order-${order.id}`}>
          <div className="real-order-ticket">
            <header className="real-ticket-heading"><strong>PIZZERIA ROMA</strong><span>COMMANDE {order.publicReference}</span></header>
            <h3 id={`order-${order.id}`}>{order.fulfillment === 'DELIVERY' ? 'LIVRAISON' : 'À EMPORTER'}</h3>
            <p className="real-ticket-status">{labels[order.status] ?? order.status} · {order.paymentStatus === 'CREDITED' ? 'PAYÉE PAR AVOIR' : 'PAYÉE'}</p>
            <div className="real-ticket-details">
              <p><strong>À préparer :</strong> {order.scheduledFor?.toLocaleString('fr-BE', { timeZone: 'Europe/Brussels', dateStyle: 'short', timeStyle: 'short' }) ?? 'Créneau à confirmer'}</p>
              <p><strong>Client :</strong> {order.contactName || '—'}{order.phone && <> · {order.phone}</>}</p>
              {order.fulfillment === 'DELIVERY' && <p><strong>Adresse :</strong> {order.address}{order.zoneId && <> · zone {order.zoneId}</>}</p>}
            </div>
            {order.comment && <p className="real-ticket-note"><strong>NOTE CUISINE</strong><br />{order.comment}</p>}
            <div className="real-ticket-items"><strong>ARTICLES</strong><ul>{items.map((item, index) => <li key={index}><b>{item.quantity} ×</b><span>{item.label}{item.loyaltyFreeQuantity ? ` · ${item.loyaltyFreeQuantity} offert(s)` : ''}</span></li>)}</ul></div>
            {order.loyaltyDiscountCents > 0 && <p className="real-ticket-status">FIDÉLITÉ · −{money(order.loyaltyDiscountCents)}</p>}
            {order.discountCents > 0 && <p className="real-ticket-status">{order.promotionName ?? 'Promotion'} · −{money(order.discountCents)}</p>}
            <div className="real-ticket-total"><strong>TOTAL COMMANDE</strong><b>{money(order.totalCents)}</b></div>
            {order.creditAppliedCents > 0 && <p className="real-ticket-status">AVOIR UTILISÉ · {money(order.creditAppliedCents)}</p>}
            {amountPaidOnline > 0 && <p className="real-ticket-status">PAYÉ EN LIGNE · {money(amountPaidOnline)}</p>}
          </div>
          <RealOrderActions id={order.id} revision={order.revision} statuses={nextRealOrderStatuses(order.status, order.fulfillment)} canRefund={isManager && (stripeReady() || order.paymentStatus === 'CREDITED')} canCredit={isManager && !!order.userId} creditAmountCents={order.totalCents} creditedOnly={order.paymentStatus === 'CREDITED'} />
        </article>;
      })}
    </section>
  </main>;
}
