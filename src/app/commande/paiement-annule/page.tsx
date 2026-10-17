import Link from 'next/link';
import CancelCheckout from './cancel-checkout';
export const metadata = { title: 'Paiement non finalisé | Pizzeria Roma', robots: { index: false, follow: false } };

export default async function PaymentCancelled({ searchParams }: { searchParams: Promise<{ reference?: string }> }) {
  const { reference } = await searchParams;
  const safeReference = typeof reference === 'string' && /^ROMA-[A-Z0-9]{20}$/.test(reference) ? reference : null;
  return <main className="customer-page"><h1>Paiement non finalisé</h1>{safeReference && <p>Référence de tentative : {safeReference}</p>}<p>La commande n’est pas envoyée en cuisine tant que Stripe n’a pas confirmé le paiement.</p><CancelCheckout reference={safeReference}/><Link href="/panier">Retour au panier</Link></main>;
}
