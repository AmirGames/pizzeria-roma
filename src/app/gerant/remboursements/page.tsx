import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '../../../lib/db';
import { requirePermission } from '../../../lib/auth';
import { realOrdersEnabled } from '../../../lib/real-orders';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Remboursements | Pizzeria Roma', robots: { index: false, follow: false } };

export default async function RefundQueue() {
  if (!realOrdersEnabled()) notFound();
  try {
    await requirePermission('orders:refund');
  } catch (error) {
    if (!(error instanceof Error) || error.message !== 'FORBIDDEN') throw error;
    return <main className="manager-page"><h1>Accès gérant requis</h1><Link className="manager-button-link" href="/gerant/connexion">Connexion gérant</Link></main>;
  }

  const orders = await prisma.order.findMany({
    where: { paymentStatus: 'REFUND_REQUIRED' },
    select: { id: true, publicReference: true, contactName: true, phone: true, totalCents: true, currency: true, placedAt: true, fulfillment: true },
    orderBy: [{ updatedAt: 'asc' }, { id: 'asc' }],
    take: 100,
  });

  return <main className="manager-page">
    <p className="manager-eyebrow">PAIEMENTS · SUIVI STRIPE</p>
    <h1>Remboursements à traiter</h1>
    <div className="manager-notice"><strong>Vérification Stripe nécessaire</strong><span>Les remboursements en attente sont suivis par webhook. Si Stripe demande une action ou si le statut reste bloqué, vérifiez le paiement dans le Dashboard Stripe avant d’agir.</span></div>
    <section className="manager-orders-panel" aria-labelledby="refund-list-title">
      <h2 id="refund-list-title">En attente ({orders.length})</h2>
      <p><Link href="/gerant/remboursements">Actualiser la liste</Link></p>
      {!orders.length ? <p>Aucun remboursement en attente.</p> : orders.map(order => <article className="test-order-card" key={order.id}>
        <h3>{order.publicReference}</h3>
        <p>Commande du {order.placedAt.toLocaleString('fr-BE', { timeZone: 'Europe/Brussels' })} · {order.fulfillment === 'DELIVERY' ? 'Livraison' : 'Retrait'}</p>
        <p><strong>{order.contactName || 'Client'}{order.phone ? ` · ${order.phone}` : ''}</strong></p>
        <p>Montant : {new Intl.NumberFormat('fr-BE', { style: 'currency', currency: order.currency }).format(order.totalCents / 100)}</p>
        <p>Ouvrez le paiement correspondant dans Stripe pour consulter les détails ou terminer une action demandée.</p>
      </article>)}
    </section>
  </main>;
}
