import type { Metadata } from 'next';
import './globals.css';
import SiteHeader from '../components/site-header';
import { testOrdersEnabled } from '../lib/test-mode';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Pizzeria Roma | Namur',
  description: 'Pizzeria Roma à Namur — découvrez la carte, personnalisez vos choix et préparez votre commande.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fr"><body><SiteHeader showTestLinks={testOrdersEnabled()} />{children}</body></html>;
}
