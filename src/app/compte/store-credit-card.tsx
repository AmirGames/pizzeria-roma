import { getStoreCredit } from '../../lib/store-credit';

type StoreCredit = Awaited<ReturnType<typeof getStoreCredit>>;
const money = (cents: number) => new Intl.NumberFormat('fr-BE', { style: 'currency', currency: 'EUR' }).format(cents / 100);
const labels: Record<string, string> = { MANAGER_GRANT: 'Avoir accordé par le restaurant', ORDER_REDEMPTION: 'Avoir utilisé sur une commande', ORDER_REFUND: 'Avoir restitué après remboursement' };

export default function StoreCreditCard({ credit }: { credit: StoreCredit }) {
  return <section className="customer-loyalty" aria-labelledby="store-credit-title">
    <h2 id="store-credit-title">Mon avoir</h2>
    <p><strong>Solde disponible : {money(credit.balanceCents)}</strong></p>
    <p>Vous pouvez utiliser cet avoir à la prochaine commande en étant connecté à votre compte.</p>
    {credit.recentEntries.length > 0 && <ul>{credit.recentEntries.map(entry => <li key={entry.id}>{labels[entry.kind] ?? 'Mouvement'} · {entry.amountCents > 0 ? '+' : ''}{money(entry.amountCents)} · {entry.createdAt.toLocaleDateString('fr-BE', { timeZone: 'Europe/Brussels' })}{entry.note && ` · ${entry.note}`}</li>)}</ul>}
  </section>;
}
