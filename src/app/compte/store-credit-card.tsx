import { getStoreCredit } from '../../lib/store-credit';
import type { SiteLocale } from '../../lib/locale';

type StoreCredit = Awaited<ReturnType<typeof getStoreCredit>>;
const labels: Record<string, string> = { MANAGER_GRANT: 'Avoir accordé par le restaurant', ORDER_REDEMPTION: 'Avoir utilisé sur une commande', ORDER_REFUND: 'Avoir restitué après remboursement' };

export default function StoreCreditCard({ credit, locale = 'fr' }: { credit: StoreCredit; locale?: SiteLocale }) {
  const en = locale === 'en';
  const money = (cents: number) => new Intl.NumberFormat(en ? 'en-BE' : 'fr-BE', { style: 'currency', currency: 'EUR' }).format(cents / 100);
  const entryLabels: Record<string, string> = en ? { MANAGER_GRANT: 'Credit granted by the restaurant', ORDER_REDEMPTION: 'Credit used for an order', ORDER_REFUND: 'Credit returned after a refund' } : labels;
  return <section className="customer-loyalty" aria-labelledby="store-credit-title">
    <h2 id="store-credit-title">{en ? 'Store credit' : 'Mon avoir'}</h2>
    <p><strong>{en ? 'Available balance' : 'Solde disponible'} : {money(credit.balanceCents)}</strong></p>
    <p>{en ? 'You can use this credit on your next order when signed in.' : 'Vous pouvez utiliser cet avoir à la prochaine commande en étant connecté à votre compte.'}</p>
    {credit.recentEntries.length > 0 && <ul>{credit.recentEntries.map(entry => <li key={entry.id}>{entryLabels[entry.kind] ?? (en ? 'Transaction' : 'Mouvement')} · {entry.amountCents > 0 ? '+' : ''}{money(entry.amountCents)} · {entry.createdAt.toLocaleDateString(en ? 'en-BE' : 'fr-BE', { timeZone: 'Europe/Brussels' })}{entry.note && ` · ${entry.note}`}</li>)}</ul>}
  </section>;
}
