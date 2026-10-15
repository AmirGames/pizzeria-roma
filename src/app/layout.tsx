import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';
import { testOrdersEnabled } from '../lib/test-mode';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Pizzeria Roma | Namur',
  description: 'Pizzeria Roma à Namur — site de commande en préparation.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fr"><body>{testOrdersEnabled() && <nav className="customer-actions" aria-label="Espace de test"><Link href="/compte">Mon espace client</Link><Link href="/commande/test">Commander en mode test</Link></nav>}{children}</body></html>;
}
