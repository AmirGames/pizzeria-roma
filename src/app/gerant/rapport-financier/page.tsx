import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '../../../lib/db';
import { requirePermission } from '../../../lib/auth';
import { realOrdersEnabled } from '../../../lib/real-orders';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Rapport financier | Pizzeria Roma', robots: { index: false, follow: false } };

const zone = 'Europe/Brussels';
const dateFormatter = new Intl.DateTimeFormat('en-GB', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit' });
const offsetFormatter = new Intl.DateTimeFormat('en-GB', { timeZone: zone, timeZoneName: 'longOffset' });
const moneyFormatter = new Intl.NumberFormat('fr-BE', { style: 'currency', currency: 'EUR' });
const paymentStatuses = ['PAID', 'CREDITED', 'REFUND_REQUIRED', 'REFUNDED'] as const;

function dateKey(date: Date) {
  const parts = Object.fromEntries(dateFormatter.formatToParts(date).map(part => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function shiftDate(key: string, amount: number) {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day + amount)).toISOString().slice(0, 10);
}

function validDateKey(value: string | undefined): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toISOString().slice(0, 10) === value;
}

function brusselsMidnight(key: string) {
  const [year, month, day] = key.split('-').map(Number);
  const wallTime = Date.UTC(year, month - 1, day);
  let instant = wallTime;
  for (let index = 0; index < 3; index += 1) {
    const zoneName = offsetFormatter.formatToParts(new Date(instant)).find(part => part.type === 'timeZoneName')?.value;
    const match = /^GMT([+-])(\d{2}):(\d{2})$/.exec(zoneName ?? '');
    if (!match) throw new Error('INVALID_REPORT_TIMEZONE');
    const offsetMinutes = (Number(match[2]) * 60 + Number(match[3])) * (match[1] === '+' ? 1 : -1);
    instant = wallTime - offsetMinutes * 60_000;
  }
  return new Date(instant);
}

function formatDate(key: string) {
  return new Intl.DateTimeFormat('fr-BE', { timeZone: zone, dateStyle: 'medium' }).format(brusselsMidnight(key));
}

function money(cents: number) {
  return moneyFormatter.format(cents / 100);
}

function expense(cents: number) {
  return cents > 0 ? `−${money(cents)}` : money(0);
}

function csvCell(value: string | number) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function csvEuros(cents: number) {
  return (cents / 100).toFixed(2).replace('.', ',');
}

type ReportSearchParams = Promise<{ from?: string; to?: string }>;

export default async function FinancialReport({ searchParams }: { searchParams: ReportSearchParams }) {
  if (!realOrdersEnabled()) notFound();
  try {
    await requirePermission('reports:read');
  } catch (error) {
    if (!(error instanceof Error) || error.message !== 'FORBIDDEN') throw error;
    return <main className="manager-page"><h1>Accès gérant requis</h1><p>Connectez-vous pour consulter le rapport financier.</p><Link className="manager-button-link" href="/gerant/connexion">Connexion gérant</Link></main>;
  }

  const today = dateKey(new Date());
  const defaultFrom = `${today.slice(0, 7)}-01`;
  const params = await searchParams;
  const requestedFrom = validDateKey(params.from) ? params.from : defaultFrom;
  const requestedTo = validDateKey(params.to) ? params.to : today;
  const rangeDays = (Date.parse(`${requestedTo}T00:00:00Z`) - Date.parse(`${requestedFrom}T00:00:00Z`)) / 86_400_000;
  const invalidRange = requestedFrom > requestedTo || requestedTo > today || rangeDays > 365;
  const from = invalidRange ? defaultFrom : requestedFrom;
  const to = invalidRange ? today : requestedTo;
  const start = brusselsMidnight(from);
  const end = brusselsMidnight(shiftDate(to, 1));

  const orders = await prisma.order.findMany({
    where: { placedAt: { gte: start, lt: end }, paymentStatus: { in: [...paymentStatuses] }, currency: 'EUR' },
    select: {
      id: true, placedAt: true, status: true, paymentStatus: true, fulfillment: true, stripeSessionId: true,
      totalCents: true, creditAppliedCents: true, discountCents: true, loyaltyDiscountCents: true,
    },
    orderBy: { placedAt: 'asc' },
  });
  const refundedCreditEntries = orders.length ? await prisma.storeCreditEntry.findMany({
    where: { orderId: { in: orders.map(order => order.id) }, kind: 'ORDER_REFUND' },
    select: { orderId: true, amountCents: true },
  }) : [];
  const restoredCredits = new Map(refundedCreditEntries.map(entry => [entry.orderId, entry.amountCents]));
  const totals = {
    orderCount: 0, grossCents: 0, onlineCents: 0, creditUsedCents: 0,
    refundedCents: 0, pendingRefundCents: 0, discountsCents: 0,
    pickupCount: 0, pickupCents: 0, deliveryCount: 0, deliveryCents: 0,
    excludedTestCount: 0, excludedTestCents: 0,
  };
  const daily = new Map<string, { count: number; grossCents: number; refundedCents: number }>();

  for (const order of orders) {
    if (order.stripeSessionId?.startsWith('cs_test_')) {
      totals.excludedTestCount += 1;
      totals.excludedTestCents += order.totalCents;
      continue;
    }
    const day = dateKey(order.placedAt);
    const row = daily.get(day) ?? { count: 0, grossCents: 0, refundedCents: 0 };
    const onlineAmount = Math.max(0, order.totalCents - order.creditAppliedCents);
    const creditRefund = order.paymentStatus === 'CREDITED' && order.status === 'CANCELLED'
      ? Math.min(order.totalCents, restoredCredits.get(order.id) ?? 0)
      : 0;
    const refundAmount = order.paymentStatus === 'REFUNDED' ? order.totalCents : creditRefund;

    totals.grossCents += order.totalCents;
    totals.onlineCents += onlineAmount;
    totals.creditUsedCents += order.creditAppliedCents;
    totals.refundedCents += refundAmount;
    totals.pendingRefundCents += order.paymentStatus === 'REFUND_REQUIRED' ? onlineAmount : 0;
    totals.discountsCents += order.discountCents + order.loyaltyDiscountCents;
    totals.orderCount += 1;
    row.count += 1;
    row.grossCents += order.totalCents;
    row.refundedCents += refundAmount;
    if (order.fulfillment === 'DELIVERY') {
      totals.deliveryCount += 1;
      totals.deliveryCents += order.totalCents;
    } else {
      totals.pickupCount += 1;
      totals.pickupCents += order.totalCents;
    }
    daily.set(day, row);
  }

  const dailyRows = [];
  for (let day = from; day <= to; day = shiftDate(day, 1)) {
    const row = daily.get(day) ?? { count: 0, grossCents: 0, refundedCents: 0 };
    dailyRows.push({ date: day, ...row, netCents: row.grossCents - row.refundedCents });
  }
  const netCents = totals.grossCents - totals.refundedCents;
  const monthStart = defaultFrom;
  const lastSevenStart = shiftDate(today, -6);
  const quickRanges = [
    { label: 'Aujourd’hui', from: today, to: today },
    { label: '7 derniers jours', from: lastSevenStart, to: today },
    { label: 'Ce mois', from: monthStart, to: today },
  ];
  const csvRows = [
    ['Rapport financier · Pizzeria Roma'],
    ['Période', `${from} – ${to} · Europe/Brussels`],
    [],
    ['Résumé', 'Valeur'],
    ['Ventes brutes (€)', csvEuros(totals.grossCents)],
    ['Remboursements confirmés (€)', csvEuros(totals.refundedCents)],
    ['Net après remboursements (€)', csvEuros(netCents)],
    ['En attente de remboursement (€)', csvEuros(totals.pendingRefundCents)],
    ['Commandes concernées', totals.orderCount],
    ['Paiements Stripe de test exclus', totals.excludedTestCount],
    ['Payé en ligne (€)', csvEuros(totals.onlineCents)],
    ['Avoirs utilisés (€)', csvEuros(totals.creditUsedCents)],
    ['Promotions et fidélité (€)', csvEuros(totals.discountsCents)],
    [],
    ['Date', 'Commandes', 'Ventes brutes (€)', 'Remboursements (€)', 'Net (€)'],
    ...dailyRows.map(row => [row.date, row.count, csvEuros(row.grossCents), csvEuros(row.refundedCents), csvEuros(row.netCents)]),
  ];
  const csvHref = `data:text/csv;charset=utf-8,%EF%BB%BF${encodeURIComponent(csvRows.map(row => row.map(csvCell).join(';')).join('\r\n'))}`;

  return <main className="manager-page financial-report">
    <p className="manager-eyebrow">GESTION · FINANCES</p>
    <h1>Rapport financier</h1>
    <p className="manager-lede">Suivi des commandes payées, des avoirs utilisés et des remboursements.</p>
    <div className="manager-notice"><strong>Lecture des chiffres</strong><span>Les ventes et remboursements sont rattachés à la date de la commande. Les remboursements en attente restent inclus dans les montants encaissés jusqu’à confirmation. Les frais Stripe et la TVA ne sont pas déduits.</span></div>

    <section className="financial-report-filters" aria-label="Période du rapport">
      <div className="financial-report-presets">{quickRanges.map(range => <Link key={range.label} href={`/gerant/rapport-financier?from=${range.from}&to=${range.to}`}>{range.label}</Link>)}</div>
      <p><a className="manager-button-link financial-report-export" href={csvHref} download={`pizzeria-roma-rapport-${from}-${to}.csv`}>Télécharger le rapport CSV</a></p>
      <form method="get" className="financial-report-date-form">
        <label>Du <input type="date" name="from" defaultValue={from} max={today} required /></label>
        <label>Au <input type="date" name="to" defaultValue={to} max={today} required /></label>
        <button type="submit">Afficher la période</button>
      </form>
      {invalidRange && <p role="alert">Choisis une période passée valide de 366 jours maximum. Le rapport affiche le mois en cours.</p>}
      <p className="financial-report-period">Période affichée : {formatDate(from)} – {formatDate(to)} · heure de Bruxelles</p>
      {totals.excludedTestCount > 0 && <p className="financial-report-test-note">{totals.excludedTestCount} paiement{totals.excludedTestCount === 1 ? '' : 's'} Stripe de test, soit {money(totals.excludedTestCents)}, exclu{totals.excludedTestCount === 1 ? '' : 's'} des chiffres réels.</p>}
    </section>

    <section aria-labelledby="financial-summary-title">
      <h2 id="financial-summary-title">Résumé</h2>
      <dl className="manager-cards financial-report-cards">
        <div className="manager-card"><dt>Ventes brutes</dt><dd>{money(totals.grossCents)}</dd></div>
        <div className="manager-card"><dt>Remboursements confirmés</dt><dd>{expense(totals.refundedCents)}</dd></div>
        <div className="manager-card"><dt>Net après remboursements</dt><dd>{money(netCents)}</dd></div>
        <div className="manager-card"><dt>En attente de remboursement</dt><dd>{money(totals.pendingRefundCents)}</dd></div>
      </dl>
      <dl className="manager-cards financial-report-cards financial-report-secondary-cards">
        <div className="manager-card"><dt>Commandes concernées</dt><dd>{totals.orderCount}</dd></div>
        <div className="manager-card"><dt>Payé en ligne</dt><dd>{money(totals.onlineCents)}</dd></div>
        <div className="manager-card"><dt>Avoirs utilisés</dt><dd>{money(totals.creditUsedCents)}</dd></div>
        <div className="manager-card"><dt>Promotions et fidélité</dt><dd>{money(totals.discountsCents)}</dd></div>
        <div className="manager-card"><dt>Panier moyen brut</dt><dd>{money(totals.orderCount ? Math.round(totals.grossCents / totals.orderCount) : 0)}</dd></div>
      </dl>
    </section>

    <section aria-labelledby="financial-fulfillment-title">
      <h2 id="financial-fulfillment-title">Répartition des commandes</h2>
      <dl className="manager-cards financial-report-fulfillment">
        <div className="manager-card"><dt>Retraits</dt><dd>{totals.pickupCount} · {money(totals.pickupCents)}</dd></div>
        <div className="manager-card"><dt>Livraisons</dt><dd>{totals.deliveryCount} · {money(totals.deliveryCents)}</dd></div>
      </dl>
    </section>

    <section className="manager-orders-panel" aria-labelledby="financial-daily-title">
      <h2 id="financial-daily-title">Détail par jour</h2>
      {dailyRows.length ? <div className="financial-report-table-wrap"><table className="financial-report-table">
        <thead><tr><th scope="col">Date</th><th scope="col">Commandes</th><th scope="col">Ventes brutes</th><th scope="col">Remboursements</th><th scope="col">Net</th></tr></thead>
        <tbody>{dailyRows.map(row => <tr key={row.date}><th scope="row">{formatDate(row.date)}</th><td>{row.count}</td><td>{money(row.grossCents)}</td><td>{expense(row.refundedCents)}</td><td><strong>{money(row.netCents)}</strong></td></tr>)}</tbody>
      </table></div> : <p>Aucune commande financière sur cette période.</p>}
    </section>
  </main>;
}
