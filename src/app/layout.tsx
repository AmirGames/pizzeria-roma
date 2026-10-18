import type { Metadata, Viewport } from 'next';
import './globals.css';
import SiteHeader from '../components/site-header';
import SiteFooter from '../components/site-footer';
import ServiceWorkerRegister from '../components/service-worker-register';
import RestaurantJsonLd from '../components/restaurant-json-ld';
import { testOrdersEnabled } from '../lib/test-mode';
import { siteMetadataBase } from '../lib/site-seo';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  metadataBase: siteMetadataBase,
  applicationName: 'Pizzeria Roma',
  title: 'Pizzeria Roma | Pizza italienne à Namur',
  description: 'Pizzas et pâtes italiennes à Namur depuis 2003. Découvrez la carte, les horaires et les options à emporter ou en livraison.',
  alternates: { canonical: '/' },
  openGraph: { title: 'Pizza italienne à Namur', description: 'Pizzas et pâtes italiennes à Namur depuis 2003. Découvrez la carte de Pizzeria Roma.', url: '/', siteName: 'Pizzeria Roma', locale: 'fr_BE', type: 'website', images: [{ url: '/roma-hero.png', alt: 'Pizzeria Roma à Namur' }] },
  twitter: { card: 'summary_large_image', title: 'Pizza italienne à Namur | Pizzeria Roma', description: 'Pizzas et pâtes italiennes à Namur depuis 2003.', images: ['/roma-hero.png'] },
  verification: process.env.GOOGLE_SITE_VERIFICATION ? { google: process.env.GOOGLE_SITE_VERIFICATION } : undefined,
  manifest: '/manifest.webmanifest',
  icons: { icon: '/icon.svg', shortcut: '/icon.svg' },
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Roma' },
};

export const viewport: Viewport = { themeColor: '#071b16' };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fr-BE"><body suppressHydrationWarning><RestaurantJsonLd /><ServiceWorkerRegister /><SiteHeader showTestLinks={testOrdersEnabled()} />{children}<SiteFooter /></body></html>;
}
