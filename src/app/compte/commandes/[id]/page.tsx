import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '../../../../lib/auth';
import { prisma } from '../../../../lib/db';
import { testOrdersEnabled } from '../../../../lib/test-mode';
import { TEST_STATUS_LABELS } from '../../../../lib/test-order-policy.mjs';
import type { TestOrderSnapshot } from '../../../../lib/test-order-policy.mjs';
import TestOrderSummary from '../../../../components/test-order-summary';
import TestOrderActions from '../../../../components/test-order-actions';
import CustomerReorder from '../../../../components/customer-reorder';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Ma commande de test | Pizzeria Roma', robots: { index: false, follow: false } };
export default async function TestOrderDetail({ params }: { params: Promise<{ id: string }> }) {
  if (!testOrdersEnabled()) notFound();
  const user = await getCurrentUser();
  if (!user) redirect('/compte');
  const { id } = await params;
  const order = await prisma.testOrder.findFirst({ where: { id, userId: user.id } });
  if (!order) notFound();
  return <main className="customer-page"><Link href="/compte">← Mon espace client</Link><h1>Commande de test enregistrée</h1><p>{order.publicReference}</p><p>Aucune commande n’est envoyée au restaurant. Aucun paiement ni créneau réservé.</p><h2>Suivi : {TEST_STATUS_LABELS[order.status]}</h2><TestOrderActions id={order.id} revision={order.revision} statuses={order.status === 'PENDING' ? ['CANCELLED'] : []} customer /><TestOrderSummary items={order.itemsSnapshot as TestOrderSnapshot[]} totalCents={order.totalCents} /><CustomerReorder orderId={order.id} /><h2>Coordonnées de cet essai</h2><p>{order.contactName} · {order.phone}</p><p>{order.fulfillment === 'DELIVERY' ? `Livraison simulée · ${order.address} · zone ${order.zoneId} (adresse non vérifiée)` : 'Retrait simulé sur place'}</p>{order.comment && <p>Commentaire : {order.comment}</p>}<Link href="/menu">Retour à la carte</Link></main>;
}
