import type { Metadata, Viewport } from 'next';
import './globals.css';
import SiteHeader from '../components/site-header';
import SiteFooter from '../components/site-footer';
import ServiceWorkerRegister from '../components/service-worker-register';
import { testOrdersEnabled } from '../lib/test-mode';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  applicationName: 'Pizzeria Roma',
  title: 'Pizzeria Roma | Namur',
  description: 'Pizzeria Roma à Namur — découvrez la carte, personnalisez vos choix et préparez votre commande.',
  manifest: '/manifest.webmanifest',
  icons: { icon: '/icon.svg', shortcut: '/icon.svg' },
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Roma' },
};

export const viewport: Viewport = { themeColor: '#071b16' };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fr"><body suppressHydrationWarning><ServiceWorkerRegister /><SiteHeader showTestLinks={testOrdersEnabled()} />{children}<SiteFooter /></body></html>;
}
