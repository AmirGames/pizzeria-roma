import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requirePermission } from '../../../lib/auth';
import { testOrdersEnabled } from '../../../lib/test-mode';
import { TEST_STATUS_LABELS, nextTestStatuses } from '../../../lib/test-order-policy.mjs';
import type { TestOrderSnapshot } from '../../../lib/test-order-policy.mjs';
import TestOrderSummary from '../../../components/test-order-summary';
import TestOrderActions from '../../../components/test-order-actions';
import RefreshTestOrders from '../../../components/refresh-test-orders';
import { parseStaffTestFilters, staffTestHref, STAFF_TEST_PAGE_SIZE } from '../../../lib/staff-test-filters.mjs';
import { listStaffTestOrders } from '../../../lib/staff-test-orders';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Commandes de test | Pizzeria Roma', robots: { index: false, follow: false } };
export default async function StaffTestOrders({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  if (!testOrdersEnabled()) notFound();
  let staff;
  try { staff = await requirePermission('orders:read'); }
  catch (error) { if (!(error instanceof Error) || error.message !== 'FORBIDDEN') throw error; return <main className="customer-page"><h1>Accès professionnel requis</h1><Link href="/gerant/connexion">Connexion gérant</Link></main>; }
  let filters = parseStaffTestFilters();
  let filterError: string | undefined;
  try { filters = parseStaffTestFilters(await searchParams); }
  catch { filterError = 'Filtres invalides. La file à traiter est affichée avec les réglages par défaut.'; }
  const result = await listStaffTestOrders(filters);
  const from = (result.page - 1) * STAFF_TEST_PAGE_SIZE + 1;
  return <main className="customer-page"><Link href="/gerant/carte">← Gestion de la carte</Link>{staff.role === 'MANAGER' && <p><Link href="/gerant">Tableau de bord gérant</Link></p>}<h1>Gérant et cuisine — commandes de test</h1>
    <p>Simulation uniquement. Ne préparez pas ces commandes. Choisissez le tri par créneau pour voir ensemble les essais prévus le plus tôt.</p>
    <section aria-labelledby="staff-test-list-title"><h2 id="staff-test-list-title">File des essais</h2>
      <form key={JSON.stringify([filters, result.page])} method="get" action="/gerant/commandes-test#staff-test-list-title"><fieldset><legend>Filtrer la file</legend>
        <label htmlFor="staff-test-q">Référence à rechercher</label><input id="staff-test-q" name="q" type="search" maxLength={64} defaultValue={filters.q} placeholder="Référence complète ou partielle" />
        <label htmlFor="staff-test-status">Statut des essais</label><select id="staff-test-status" name="statut" defaultValue={filters.status}><option value="active">À traiter</option><option value="all">Tous les statuts</option>{Object.entries(TEST_STATUS_LABELS).map(([status, label]) => <option key={status} value={status}>{label}</option>)}</select>
        <label htmlFor="staff-test-mode">Mode des essais</label><select id="staff-test-mode" name="mode" defaultValue={filters.fulfillment}><option value="">Tous les modes</option><option value="PICKUP">Retrait simulé</option><option value="DELIVERY">Livraison simulée</option></select>
        <label htmlFor="staff-test-sort">Ordre des essais</label><select id="staff-test-sort" name="tri" defaultValue={filters.sort}><option value="oldest">Enregistrés les plus anciens d’abord</option><option value="newest">Enregistrés les plus récents d’abord</option><option value="scheduled">Créneaux prévus les plus proches d’abord</option></select>
        <button type="submit">Appliquer les filtres</button> <Link href="/gerant/commandes-test#staff-test-list-title">Réinitialiser la file</Link>
      </fieldset></form><RefreshTestOrders />{filterError && <p role="alert">{filterError}</p>}
      {!result.total ? <p>Aucun essai ne correspond à ces filtres.</p> : <>
        <p role="status">Essais {from}–{Math.min(from + STAFF_TEST_PAGE_SIZE - 1, result.total)} sur {result.total} · Page {result.page} sur {result.pages}</p>
        {result.orders.map(order => <article className="test-order-card" key={order.id} aria-labelledby={`staff-order-${order.id}`}><h3 id={`staff-order-${order.id}`}>{order.publicReference}</h3><p>{TEST_STATUS_LABELS[order.status]} · enregistré le {order.placedAt.toLocaleString('fr-BE', { timeZone: 'Europe/Brussels' })}</p><p>Créneau souhaité : {order.scheduledFor.toLocaleString('fr-BE', { timeZone: 'Europe/Brussels', dateStyle: 'short', timeStyle: 'short' })}</p><p>{order.contactName} · {order.phone}</p><p>{order.fulfillment === 'DELIVERY' ? `Livraison simulée — ${order.address} (${order.zoneId})` : 'Retrait simulé'}</p>{order.comment && <p>{order.comment}</p>}<TestOrderSummary items={order.itemsSnapshot as TestOrderSnapshot[]} totalCents={order.totalCents} /><TestOrderActions id={order.id} revision={order.revision} statuses={nextTestStatuses(order.status, order.fulfillment)} /></article>)}
        <nav className="customer-actions" aria-label="Pages de la file des essais">{result.page > 1 && <Link href={staffTestHref(filters, result.page - 1)}>Page précédente</Link>}{result.page < result.pages && <Link href={staffTestHref(filters, result.page + 1)}>Page suivante</Link>}</nav>
      </>}
    </section>
  </main>;
}
