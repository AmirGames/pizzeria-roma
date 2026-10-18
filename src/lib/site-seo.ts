import type { Metadata } from 'next';

const configuredOrigin = process.env.APP_ORIGIN?.trim() || 'http://localhost:3000';
let parsedOrigin: URL;
try {
  const candidate = new URL(configuredOrigin);
  parsedOrigin = ['http:', 'https:'].includes(candidate.protocol) && !candidate.username && !candidate.password
    ? new URL(candidate.origin)
    : new URL('http://localhost:3000');
} catch {
  parsedOrigin = new URL('http://localhost:3000');
}

export const siteMetadataBase = parsedOrigin;
export const absoluteSiteUrl = (path: string) => new URL(path, siteMetadataBase).toString();

export function publicPageMetadata(title: string, description: string, path: string, locale: 'fr' | 'en' = 'fr'): Metadata {
  const brandedTitle = `${title} | Pizzeria Roma`;
  return {
    title: brandedTitle,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: brandedTitle,
      description,
      url: path,
      siteName: 'Pizzeria Roma',
      locale: locale === 'en' ? 'en_BE' : 'fr_BE',
      type: 'website',
      images: [{ url: '/roma-hero.png', alt: locale === 'en' ? 'Pizzeria Roma in Namur' : 'Pizzeria Roma à Namur' }],
    },
    twitter: { card: 'summary_large_image', title: brandedTitle, description, images: ['/roma-hero.png'] },
  };
}
