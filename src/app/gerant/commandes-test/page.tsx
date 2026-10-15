import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requirePermission } from '../../../lib/auth';
import { prisma } from '../../../lib/db';
import { testOrdersEnabled } from '../../../lib/test-mode';
import { TEST_STATUS_LABELS, nextTestStatuses } from '../../../lib/test-order-policy.mjs';
import type { TestOrderSnapshot } from '../../../lib/test-order-policy.mjs';
import TestOrderSummary from '../../../components/test-order-summary';
import TestOrderActions from '../../../components/test-order-actions';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Commandes de test | Pizzeria Roma', robots: { index: false, follow: false } };
export default async function StaffTestOrders() {
  if (!testOrdersEnabled()) notFound();
  try { await requirePermission('orders:read'); }
  catch (error) { if (!(error instanceof Error) || error.message !== 'FORBIDDEN') throw error; return <main className="customer-page"><h1>Accès professionnel requis</h1><Link href="/gerant/connexion">Connexion gérant</Link></main>; }
  const orders = await prisma.testOrder.findMany({ orderBy: { placedAt: 'desc' }, take: 100 });
  return <main className="customer-page"><Link href="/gerant/carte">← Gestion de la carte</Link><h1>Gérant et cuisine — commandes de test</h1><p>Simulation uniquement. Ne préparez pas ces commandes. Les 100 derniers tests sont affichés.</p>{!orders.length && <p>Aucune commande de test.</p>}{orders.map(order => <article className="test-order-card" key={order.id}><h2>{order.publicReference}</h2><p>{TEST_STATUS_LABELS[order.status]} · {order.placedAt.toLocaleString('fr-BE', { timeZone: 'Europe/Brussels' })}</p><p>{order.contactName} · {order.phone}</p><p>{order.fulfillment === 'DELIVERY' ? `Livraison simulée — ${order.address} (${order.zoneId}, adresse non vérifiée)` : 'Retrait simulé'}</p>{order.comment && <p>{order.comment}</p>}<TestOrderSummary items={order.itemsSnapshot as TestOrderSnapshot[]} totalCents={order.totalCents} /><TestOrderActions id={order.id} revision={order.revision} statuses={nextTestStatuses(order.status, order.fulfillment)} /></article>)}</main>;
}
