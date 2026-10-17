import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'Pizzeria Roma — Namur',
    short_name: 'Roma',
    description: 'La carte et les commandes de Pizzeria Roma à Namur.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#f8f4ec',
    theme_color: '#071b16',
    lang: 'fr-BE',
    icons: [
      { src: '/icon.svg', sizes: '192x192', type: 'image/svg+xml', purpose: 'any' },
      { src: '/icon.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any' },
      { src: '/icon-maskable.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'maskable' },
    ],
  };
}
