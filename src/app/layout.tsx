import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Pizzeria Roma | Namur',
  description: 'Pizzeria Roma à Namur — site de commande en préparation.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fr"><body>{children}</body></html>;
}
