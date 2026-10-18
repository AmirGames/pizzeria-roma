import Link from 'next/link';
import { CUSTOMER_HISTORY_PAGE_SIZE, customerHistoryHref, type CustomerHistoryFilters } from '../../lib/customer-history.mjs';
import type { CustomerOrderHistoryResult } from '../../lib/customer-order-history';
import { TEST_STATUS_LABELS } from '../../lib/test-order-policy.mjs';
import type { SiteLocale } from '../../lib/locale';
export default function OrderHistory({ history, filters, error, locale = 'fr' }: { history: CustomerOrderHistoryResult; filters: CustomerHistoryFilters; error?: string; locale?: SiteLocale }) {
  const en = locale === 'en';
  const statusLabels: Record<string, string> = en ? { PENDING: 'Awaiting confirmation', ACCEPTED: 'Accepted', PREPARING: 'Preparing', READY: 'Ready', OUT_FOR_DELIVERY: 'Out for delivery', COMPLETED: 'Completed', CANCELLED: 'Cancelled' } : TEST_STATUS_LABELS;
  const filtered = !!filters.q || !!filters.status;
  const from = (history.page - 1) * CUSTOMER_HISTORY_PAGE_SIZE + 1;
  return <section aria-labelledby="customer-history-title"><h2 id="customer-history-title">{en ? 'My test orders' : 'Mes commandes de test'}</h2>
    <form key={JSON.stringify([filters.q, filters.status, history.page])} method="get" action="/compte#customer-history-title"><fieldset><legend>{en ? 'Find a test order' : 'Retrouver un essai'}</legend>
      <label htmlFor="customer-history-q">{en ? 'Test order reference' : 'Référence de l’essai'}</label><input id="customer-history-q" name="q" type="search" maxLength={64} defaultValue={filters.q} placeholder={en ? 'Full or partial reference' : 'Référence complète ou partielle'} />
      <label htmlFor="customer-history-status">{en ? 'Test order status' : 'Statut de l’essai'}</label><select id="customer-history-status" name="statut" defaultValue={filters.status}><option value="">{en ? 'All statuses' : 'Tous les statuts'}</option>{Object.keys(TEST_STATUS_LABELS).map(status => <option key={status} value={status}>{statusLabels[status] ?? status}</option>)}</select>
      <button type="submit">{en ? 'Search test orders' : 'Rechercher mes essais'}</button> <Link href="/compte#customer-history-title">{en ? 'Reset filters' : 'Réinitialiser les filtres'}</Link>
    </fieldset></form>{error && <p role="alert">{error}</p>}
    {!history.total ? <p>{filtered ? (en ? 'No test orders match these filters.' : 'Aucun essai ne correspond à ces filtres.') : (en ? 'You have no test orders yet.' : 'Vous n’avez pas encore de commande de test.')}</p> : <>
      <p role="status">{en ? 'Test orders' : 'Essais'} {from}–{Math.min(from + CUSTOMER_HISTORY_PAGE_SIZE - 1, history.total)} {en ? 'of' : 'sur'} {history.total} · {en ? 'Page' : 'Page'} {history.page} {en ? 'of' : 'sur'} {history.pages}</p>
      <ul className="customer-orders">{history.orders.map(order => <li key={order.id}><Link href={`/compte/commandes/${order.id}`}>{order.publicReference}</Link><p>{statusLabels[order.status] ?? order.status} · {new Intl.NumberFormat(en ? 'en-BE' : 'fr-BE', { style: 'currency', currency: 'EUR' }).format(order.totalCents / 100)} · {order.placedAt.toLocaleString(en ? 'en-BE' : 'fr-BE', { timeZone: 'Europe/Brussels' })}</p></li>)}</ul>
      <nav className="customer-actions" aria-label={en ? 'Test order pages' : 'Pages de mes essais'}>
        {history.page > 1 && <Link href={customerHistoryHref(filters, history.page - 1)}>{en ? 'Previous page' : 'Page précédente'}</Link>}
        {history.page < history.pages && <Link href={customerHistoryHref(filters, history.page + 1)}>{en ? 'Next page' : 'Page suivante'}</Link>}
      </nav>
    </>}
  </section>;
}
