import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '../../../lib/auth';
import { testOrdersEnabled } from '../../../lib/test-mode';
import TestCheckout from './test-checkout';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Commande de test | Pizzeria Roma', robots: { index: false, follow: false } };
export default async function TestCheckoutPage() {
  if (!testOrdersEnabled()) return <main className="customer-page"><h1>Commandes de test désactivées</h1><Link href="/menu">Voir la carte</Link></main>;
  const user = await getCurrentUser();
  if (!user) redirect('/compte?retour=commande');
  if (user.role !== 'CUSTOMER') return <main className="customer-page"><h1>Un compte client est nécessaire</h1><Link href="/compte">Changer de compte</Link></main>;
  return <main className="customer-page"><Link href="/panier">← Panier</Link><h1>Passer une commande de test</h1><p>Aucun paiement, aucune préparation réelle, aucun créneau réservé. Utilisez des coordonnées fictives.</p><TestCheckout name={user.name ?? ''} phone={user.phone ?? ''} /></main>;
}
