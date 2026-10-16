import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requirePermission } from '../../lib/auth';
import { testOrdersEnabled } from '../../lib/test-mode';
import { loadStaffDashboard } from '../../lib/staff-dashboard-data';
import { parseStaffTestFilters, staffTestHref } from '../../lib/staff-test-filters.mjs';
import RefreshTestOrders from '../../components/refresh-test-orders';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Tableau de bord gérant | Pizzeria Roma', robots: { index: false, follow: false } };
export default async function ManagerDashboard() {
  if (!testOrdersEnabled()) notFound();
  try { await requirePermission('reports:read'); }
  catch (error) { if (!(error instanceof Error) || error.message !== 'FORBIDDEN') throw error; return <main className="manager-page"><p className="manager-eyebrow">PIZZERIA ROMA · ESPACE PROFESSIONNEL</p><h1>Accès gérant requis</h1><p>Connectez-vous pour accéder aux outils de gestion.</p><Link className="manager-button-link" href="/gerant/connexion">Connexion gérant</Link><p><Link href="/gerant/commandes-test">Ouvrir la file professionnelle</Link></p></main>; }
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
<<<<<<< Updated upstream
  return <main className="manager-page"><p className="manager-eyebrow">PIZZERIA ROMA · ESPACE PROFESSIONNEL</p><h1>Tableau de bord</h1><p className="manager-lede">Vue d’ensemble de l’activité en mode test.</p>
    <div className="manager-notice"><strong>Mode test</strong><span>Ces compteurs concernent uniquement les essais. Aucune préparation réelle ni aucun paiement.</span></div>
    <div className="manager-toolbar"><div><span className="manager-meta-label">Dernière actualisation</span><p>{data.refreshedAt.toLocaleString('fr-BE', { timeZone: 'Europe/Brussels' })} · heure de Bruxelles</p></div><RefreshTestOrders label="Actualiser le tableau de bord" /></div>
    <section aria-labelledby="dashboard-queue-title"><h2 id="dashboard-queue-title">File à traiter</h2><p>Essais encore actifs. Sélectionnez un compteur pour ouvrir la liste correspondante.</p>
      <nav className="manager-cards" aria-label="Compteurs de la file">{cards.map(card => <Link className="manager-card" key={card.status} href={staffTestHref({ ...defaults, status: card.status })}><h3>{card.label}</h3><p>{card.count}</p></Link>)}</nav>
=======
  return <main className="manager-page"><h1>Tableau de bord gérant</h1><p>Mode test : ces compteurs concernent uniquement les essais. Aucune préparation réelle ni aucun paiement.</p>
    <nav className="manager-shortcuts" aria-label="Raccourcis gérant"><Link href="/gerant/carte">Gérer la carte</Link><Link href="/gerant/livraison">Livraison et créneaux</Link><Link href="/gerant/commandes-test">Ouvrir la file des essais</Link><RefreshTestOrders label="Actualiser le tableau de bord" /></nav>
    <p>Actualisé à {data.refreshedAt.toLocaleString('fr-BE', { timeZone: 'Europe/Brussels' })} · heure de Bruxelles.</p>
    <section aria-labelledby="dashboard-queue-title"><h2 id="dashboard-queue-title">File à traiter</h2><p>Essais encore actifs, quelle que soit leur date d’enregistrement. Chaque compteur ouvre la liste correspondante.</p>
      <nav className={styles.cards} aria-label="Compteurs de la file">{cards.map(card => <Link className={styles.card} key={card.status} href={staffTestHref({ ...defaults, status: card.status })}><h3>{card.label}</h3><p>{card.count}</p></Link>)}</nav>
>>>>>>> Stashed changes
    </section>
    <section aria-labelledby="dashboard-today-title"><h2 id="dashboard-today-title">Résumé du jour <span className="manager-section-date"><time dateTime={data.date}>{data.date.split('-').reverse().join('/')}</time></span></h2><p>Essais enregistrés de minuit à minuit en heure de Bruxelles.</p>
      <dl className="manager-cards">{[
        ['Essais enregistrés', data.today.total], ['Retraits simulés', data.today.pickup], ['Livraisons simulées', data.today.delivery], ['Actuellement annulés ou refusés', data.today.cancelledOrRejected],
      ].map(([label, count]) => <div className="manager-card" key={label}><dt>{label}</dt><dd>{count}</dd></div>)}</dl>
    </section>
  </main>;
}
