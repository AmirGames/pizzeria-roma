import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requirePermission } from '../../lib/auth';
import { testOrdersEnabled } from '../../lib/test-mode';
import { loadStaffDashboard } from '../../lib/staff-dashboard-data';
import { parseStaffTestFilters, staffTestHref } from '../../lib/staff-test-filters.mjs';
import RefreshTestOrders from '../../components/refresh-test-orders';
import styles from './dashboard.module.css';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Tableau de bord gérant | Pizzeria Roma', robots: { index: false, follow: false } };
export default async function ManagerDashboard() {
  if (!testOrdersEnabled()) notFound();
  try { await requirePermission('reports:read'); }
  catch (error) { if (!(error instanceof Error) || error.message !== 'FORBIDDEN') throw error; return <main className="customer-page"><h1>Accès gérant requis</h1><Link href="/gerant/connexion">Connexion gérant</Link><p><Link href="/gerant/commandes-test">Ouvrir la file professionnelle</Link></p></main>; }
  const data = await loadStaffDashboard();
  const defaults = parseStaffTestFilters();
  const cards = [
    { label: 'À traiter', status: 'active', count: data.active },
    { label: 'À accepter', status: 'PENDING', count: data.statuses.PENDING },
    { label: 'Acceptés', status: 'ACCEPTED', count: data.statuses.ACCEPTED },
    { label: 'En préparation', status: 'PREPARING', count: data.statuses.PREPARING },
    { label: 'Prêts', status: 'READY', count: data.statuses.READY },
    { label: 'En livraison', status: 'OUT_FOR_DELIVERY', count: data.statuses.OUT_FOR_DELIVERY },
  ] as const;
  return <main className="customer-page"><h1>Tableau de bord gérant</h1><p>Mode test : ces compteurs concernent uniquement les essais. Aucune préparation réelle ni aucun paiement.</p>
    <div className="customer-actions"><Link href="/gerant/carte">Gérer la carte</Link><Link href="/gerant/commandes-test">Ouvrir la file des essais</Link><RefreshTestOrders label="Actualiser le tableau de bord" /></div>
    <p>Actualisé à {data.refreshedAt.toLocaleString('fr-BE', { timeZone: 'Europe/Brussels' })} · heure de Bruxelles.</p>
    <section aria-labelledby="dashboard-queue-title"><h2 id="dashboard-queue-title">File à traiter</h2><p>Essais encore actifs, quelle que soit leur date d’enregistrement. Chaque compteur ouvre la liste correspondante.</p>
      <nav className={styles.cards} aria-label="Compteurs de la file">{cards.map(card => <Link className={styles.card} key={card.status} href={staffTestHref({ ...defaults, status: card.status })}><h3>{card.label}</h3><p>{card.count}</p></Link>)}</nav>
    </section>
    <section aria-labelledby="dashboard-today-title"><h2 id="dashboard-today-title">Résumé du jour</h2><p>Essais enregistrés le <time dateTime={data.date}>{data.date.split('-').reverse().join('/')}</time>, de minuit à minuit en Europe/Brussels. Les statuts reflètent la dernière actualisation.</p>
      <dl className={styles.cards}>{[
        ['Essais enregistrés', data.today.total], ['Retraits simulés', data.today.pickup], ['Livraisons simulées', data.today.delivery], ['Actuellement annulés ou refusés', data.today.cancelledOrRejected],
      ].map(([label, count]) => <div className={styles.card} key={label}><dt>{label}</dt><dd>{count}</dd></div>)}</dl>
    </section>
  </main>;
}
