import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '../../../lib/auth';
import { testOrdersEnabled } from '../../../lib/test-mode';
import TestCheckout from './test-checkout';
import { listCustomerAddresses } from '../../../lib/customer-addresses';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Commande de test | Pizzeria Roma', robots: { index: false, follow: false } };
export default async function TestCheckoutPage() {
  if (!testOrdersEnabled()) return <main className="customer-page"><h1>Commandes de test désactivées</h1><Link href="/menu">Voir la carte</Link></main>;
  const user = await getCurrentUser();
  if (!user) redirect('/compte?retour=commande');
  if (user.role !== 'CUSTOMER') return <main className="customer-page"><h1>Un compte client est nécessaire</h1><Link href="/compte">Changer de compte</Link></main>;
  const addresses = await listCustomerAddresses(user.id);
  return <main className="customer-page test-checkout-page"><Link href="/panier">← Panier</Link><h1>Livraison ou à emporter</h1><p>Aucun paiement ni aucune préparation réelle. Utilisez des coordonnées fictives.</p><TestCheckout name={user.name ?? ''} phone={user.phone ?? ''} addresses={addresses} /></main>;
}
