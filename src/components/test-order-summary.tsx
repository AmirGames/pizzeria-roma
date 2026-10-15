import type { TestOrderSnapshot } from '../lib/test-order-policy.mjs';
const money = (cents: number) => new Intl.NumberFormat('fr-BE', { style: 'currency', currency: 'EUR' }).format(cents / 100);
export default function TestOrderSummary({ items, totalCents }: { items: TestOrderSnapshot[]; totalCents: number }) {
  return <><ul>{items.map((item, index) => <li key={index}><strong>{item.quantity} × {item.label} — {money(item.totalCents)}</strong><p>{[item.sizeLabel, ...item.extraLabels.map(label => `Supplément ${label}`), ...item.removedIngredients.map(label => `Sans ${label}`)].filter(Boolean).join(' · ')}</p></li>)}</ul><p><strong>Total du test : {money(totalCents)}</strong> · Aucun paiement</p></>;
}
