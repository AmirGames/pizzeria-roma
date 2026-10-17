import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requirePermission } from '../../lib/auth';
import { testOrdersEnabled } from '../../lib/test-mode';
import { realOrdersEnabled } from '../../lib/real-orders';
import { loadStaffDashboard } from '../../lib/staff-dashboard-data';
import { parseStaffTestFilters, staffTestHref } from '../../lib/staff-test-filters.mjs';
import { brusselsDayWindow } from '../../lib/staff-dashboard.mjs';
import { prisma } from '../../lib/db';
import RefreshTestOrders from '../../components/refresh-test-orders';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Tableau de bord gérant | Pizzeria Roma', robots: { index: false, follow: false } };
export default async function ManagerDashboard() {
  const showTests = testOrdersEnabled();
  const showRealOrders = realOrdersEnabled();
  if (!showTests && !showRealOrders) notFound();
  try { await requirePermission('reports:read'); }
  catch (error) { if (!(error instanceof Error) || error.message !== 'FORBIDDEN') throw error; return <main className="manager-page"><p className="manager-eyebrow">PIZZERIA ROMA · ESPACE PROFESSIONNEL</p><h1>Accès gérant requis</h1><p>Connectez-vous pour accéder aux outils de gestion.</p><Link className="manager-button-link" href="/gerant/connexion">Connexion gérant</Link>{showRealOrders&&<p><Link href="/gerant/commandes">Ouvrir les commandes réelles</Link></p>}{showTests&&<p><Link href="/gerant/commandes-test">Ouvrir les essais</Link></p>}</main>; }
  const data = showTests ? await loadStaffDashboard() : null;
  const defaults = showTests ? parseStaffTestFilters() : null;
  const realSummary = showRealOrders ? await (async () => {
    const day = brusselsDayWindow();
    const [groups, today] = await Promise.all([
      prisma.order.groupBy({ by: ['status'], where: { paymentStatus: { in: ['PAID', 'CREDITED'] } }, _count: { _all: true } }),
      prisma.order.aggregate({ where: { placedAt: { gte: day.start, lt: day.end }, paymentStatus: { in: ['PAID', 'CREDITED'] } }, _count: { _all: true }, _sum: { totalCents: true } }),
    ]);
    const countFor = (status: string) => groups.find(group => group.status === status)?._count._all ?? 0;
    return { active: countFor('ACCEPTED') + countFor('PREPARING') + countFor('READY') + countFor('OUT_FOR_DELIVERY'), accepted: countFor('ACCEPTED'), preparing: countFor('PREPARING'), ready: countFor('READY'), delivery: countFor('OUT_FOR_DELIVERY'), todayCount: today._count._all, todayTotalCents: today._sum.totalCents ?? 0, date: day.date };
  })() : null;
  const cards = [
    { label: 'À traiter', status: 'active', count: data?.active ?? 0 },
    { label: 'À accepter', status: 'PENDING', count: data?.statuses.PENDING ?? 0 },
    { label: 'Acceptés', status: 'ACCEPTED', count: data?.statuses.ACCEPTED ?? 0 },
    { label: 'En préparation', status: 'PREPARING', count: data?.statuses.PREPARING ?? 0 },
    { label: 'Prêts', status: 'READY', count: data?.statuses.READY ?? 0 },
    { label: 'En livraison', status: 'OUT_FOR_DELIVERY', count: data?.statuses.OUT_FOR_DELIVERY ?? 0 },
  ] as const;
  return <main className="manager-page"><p className="manager-eyebrow">PIZZERIA ROMA · ESPACE PROFESSIONNEL</p><h1>Tableau de bord</h1><p className="manager-lede">Vue d’ensemble de l’activité du restaurant.</p>
    {showRealOrders && realSummary && <section aria-labelledby="dashboard-real-title"><h2 id="dashboard-real-title">Commandes réelles</h2><div className="manager-notice"><strong>Commandes payées</strong><span>Ces chiffres couvrent uniquement les paiements confirmés et les commandes réglées par avoir.</span></div>
      <nav className="manager-cards" aria-label="Résumé des commandes réelles"><Link className="manager-card" href="/gerant/commandes"><h3>À traiter</h3><p>{realSummary.active}</p></Link><div className="manager-card"><dt>À préparer</dt><dd>{realSummary.accepted}</dd></div><div className="manager-card"><dt>En préparation</dt><dd>{realSummary.preparing}</dd></div><div className="manager-card"><dt>Prêtes</dt><dd>{realSummary.ready}</dd></div><div className="manager-card"><dt>En livraison</dt><dd>{realSummary.delivery}</dd></div></nav>
      <p><strong>Aujourd’hui ({realSummary.date.split('-').reverse().join('/')}):</strong> {realSummary.todayCount} commande(s) · {new Intl.NumberFormat('fr-BE', { style: 'currency', currency: 'EUR' }).format(realSummary.todayTotalCents / 100)} encaissés.</p><p><Link href="/gerant/commandes">Ouvrir la file cuisine et les commandes →</Link></p>
    </section>}
    {showTests && data && defaults && <>
      <div className="manager-notice"><strong>Mode test</strong><span>Les compteurs ci-dessous concernent les essais. Ils ne déclenchent ni préparation réelle ni paiement.</span></div>
      <div className="manager-toolbar"><div><span className="manager-meta-label">Dernière actualisation</span><p>{data.refreshedAt.toLocaleString('fr-BE', { timeZone: 'Europe/Brussels' })} · heure de Bruxelles</p></div><RefreshTestOrders label="Actualiser les essais" /></div>
      <section aria-labelledby="dashboard-queue-title"><h2 id="dashboard-queue-title">File des commandes de test</h2><p>Essais encore actifs. Sélectionnez un compteur pour ouvrir la liste correspondante.</p>
        <nav className="manager-cards" aria-label="Compteurs des commandes de test">{cards.map(card => <Link className="manager-card" key={card.status} href={staffTestHref({ ...defaults, status: card.status })}><h3>{card.label}</h3><p>{card.count}</p></Link>)}</nav>
      </section>
      <section aria-labelledby="dashboard-today-title"><h2 id="dashboard-today-title">Résumé des essais du jour <span className="manager-section-date"><time dateTime={data.date}>{data.date.split('-').reverse().join('/')}</time></span></h2><p>Essais enregistrés de minuit à minuit en heure de Bruxelles.</p>
        <dl className="manager-cards">{[
          ['Essais enregistrés', data.today.total], ['Retraits simulés', data.today.pickup], ['Livraisons simulées', data.today.delivery], ['Actuellement annulés ou refusés', data.today.cancelledOrRejected],
        ].map(([label, count]) => <div className="manager-card" key={label}><dt>{label}</dt><dd>{count}</dd></div>)}</dl>
      </section>
    </>}
  </main>;
}
