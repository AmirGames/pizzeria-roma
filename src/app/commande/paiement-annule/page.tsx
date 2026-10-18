import Link from 'next/link';
import CancelCheckout from './cancel-checkout';
import { getSiteLocale } from '../../../lib/locale';
export async function generateMetadata() { const en = (await getSiteLocale()) === 'en'; return { title: `${en ? 'Payment not completed' : 'Paiement non finalisé'} | Pizzeria Roma`, robots: { index: false, follow: false } }; }

export default async function PaymentCancelled({ searchParams }: { searchParams: Promise<{ reference?: string }> }) {
  const { reference } = await searchParams;
  const en = (await getSiteLocale()) === 'en';
  const safeReference = typeof reference === 'string' && /^ROMA-[A-Z0-9]{20}$/.test(reference) ? reference : null;
  return <main className="customer-page"><h1>{en ? 'Payment not completed' : 'Paiement non finalisé'}</h1>{safeReference && <p>{en ? 'Attempt reference' : 'Référence de tentative'} : {safeReference}</p>}<p>{en ? 'Your order is not sent to the kitchen until Stripe confirms payment.' : 'La commande n’est pas envoyée en cuisine tant que Stripe n’a pas confirmé le paiement.'}</p><CancelCheckout reference={safeReference} locale={en?'en':'fr'}/><Link href="/panier">{en ? 'Back to cart' : 'Retour au panier'}</Link></main>;
}
