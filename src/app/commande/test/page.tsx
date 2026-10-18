import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '../../../lib/auth';
import { testOrdersEnabled } from '../../../lib/test-mode';
import TestCheckout from './test-checkout';
import { listCustomerAddresses } from '../../../lib/customer-addresses';
import { getSiteLocale } from '../../../lib/locale';
import type { Metadata } from 'next';
export const dynamic = 'force-dynamic';
export async function generateMetadata(): Promise<Metadata> { const en = (await getSiteLocale()) === 'en'; return { title: `${en ? 'Test order' : 'Commande de test'} | Pizzeria Roma`, robots: { index: false, follow: false } }; }
export default async function TestCheckoutPage() {
  const locale = await getSiteLocale();
  const en = locale === 'en';
  if (!testOrdersEnabled()) return <main className="customer-page"><h1>{en ? 'Test orders are disabled' : 'Commandes de test désactivées'}</h1><Link href="/menu">{en ? 'View the menu' : 'Voir la carte'}</Link></main>;
  const user = await getCurrentUser();
  if (!user) redirect('/compte?retour=commande');
  if (user.role !== 'CUSTOMER') return <main className="customer-page"><h1>{en ? 'A customer account is required' : 'Un compte client est nécessaire'}</h1><Link href="/compte">{en ? 'Switch account' : 'Changer de compte'}</Link></main>;
  const addresses = await listCustomerAddresses(user.id);
  return <main className="customer-page test-checkout-page"><Link href="/panier">← {en ? 'Cart' : 'Panier'}</Link><h1>{en ? 'Delivery or collection' : 'Livraison ou à emporter'}</h1><p>{en ? 'No payment or real preparation will take place. Use fictional contact details.' : 'Aucun paiement ni aucune préparation réelle. Utilisez des coordonnées fictives.'}</p><TestCheckout name={user.name ?? ''} phone={user.phone ?? ''} addresses={addresses} locale={locale} /></main>;
}
