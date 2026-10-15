import type { Metadata } from 'next';
import './globals.css';
import SiteHeader from '../components/site-header';
import SiteFooter from '../components/site-footer';
import { testOrdersEnabled } from '../lib/test-mode';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Pizzeria Roma | Namur',
  description: 'Pizzeria Roma à Namur — découvrez la carte, personnalisez vos choix et préparez votre commande.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fr"><body suppressHydrationWarning><SiteHeader showTestLinks={testOrdersEnabled()} />{children}<SiteFooter /></body></html>;
}
