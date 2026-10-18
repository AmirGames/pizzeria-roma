import CartPageClient from './cart-client';
import { realOrdersEnabled } from '../../lib/real-orders';
import { getSiteLocale } from '../../lib/locale';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';
export async function generateMetadata(): Promise<Metadata> {
  const en = (await getSiteLocale()) === 'en';
  return {
    title: `${en ? 'Your cart' : 'Votre panier'} | Pizzeria Roma`,
    description: en ? 'Review your Pizzeria Roma menu selection before continuing.' : 'Vérifiez votre sélection sur la carte de Pizzeria Roma avant de continuer.',
    robots: { index: false, follow: false },
  };
}
export default async function CartPage() { return <CartPageClient realOrdersEnabled={realOrdersEnabled()} locale={await getSiteLocale()} />; }
