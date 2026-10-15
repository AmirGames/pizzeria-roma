import Link from 'next/link';
import { CUSTOMER_HISTORY_PAGE_SIZE, customerHistoryHref, type CustomerHistoryFilters } from '../../lib/customer-history.mjs';
import type { CustomerOrderHistoryResult } from '../../lib/customer-order-history';
import { TEST_STATUS_LABELS } from '../../lib/test-order-policy.mjs';
export default function OrderHistory({ history, filters, error }: { history: CustomerOrderHistoryResult; filters: CustomerHistoryFilters; error?: string }) {
  const filtered = !!filters.q || !!filters.status;
  const from = (history.page - 1) * CUSTOMER_HISTORY_PAGE_SIZE + 1;
  return <section aria-labelledby="customer-history-title"><h2 id="customer-history-title">Mes commandes de test</h2>
    <form key={JSON.stringify([filters.q, filters.status, history.page])} method="get" action="/compte#customer-history-title"><fieldset><legend>Retrouver un essai</legend>
      <label htmlFor="customer-history-q">Référence de l’essai</label><input id="customer-history-q" name="q" type="search" maxLength={64} defaultValue={filters.q} placeholder="Référence complète ou partielle" />
      <label htmlFor="customer-history-status">Statut de l’essai</label><select id="customer-history-status" name="statut" defaultValue={filters.status}><option value="">Tous les statuts</option>{Object.entries(TEST_STATUS_LABELS).map(([status, label]) => <option key={status} value={status}>{label}</option>)}</select>
      <button type="submit">Rechercher mes essais</button> <Link href="/compte#customer-history-title">Réinitialiser les filtres</Link>
    </fieldset></form>{error && <p role="alert">{error}</p>}
    {!history.total ? <p>{filtered ? 'Aucun essai ne correspond à ces filtres.' : 'Vous n’avez pas encore de commande de test.'}</p> : <>
      <p role="status">Essais {from}–{Math.min(from + CUSTOMER_HISTORY_PAGE_SIZE - 1, history.total)} sur {history.total} · Page {history.page} sur {history.pages}</p>
      <ul className="customer-orders">{history.orders.map(order => <li key={order.id}><Link href={`/compte/commandes/${order.id}`}>{order.publicReference}</Link><p>{TEST_STATUS_LABELS[order.status]} · {new Intl.NumberFormat('fr-BE', { style: 'currency', currency: 'EUR' }).format(order.totalCents / 100)} · {order.placedAt.toLocaleString('fr-BE', { timeZone: 'Europe/Brussels' })}</p></li>)}</ul>
      <nav className="customer-actions" aria-label="Pages de mes essais">
        {history.page > 1 && <Link href={customerHistoryHref(filters, history.page - 1)}>Page précédente</Link>}
        {history.page < history.pages && <Link href={customerHistoryHref(filters, history.page + 1)}>Page suivante</Link>}
      </nav>
    </>}
  </section>;
}
