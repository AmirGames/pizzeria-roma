import type { MetadataRoute } from 'next';
import { absoluteSiteUrl } from '../lib/site-seo';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/api/', '/compte', '/gerant', '/panier', '/commande'] }],
    sitemap: absoluteSiteUrl('/sitemap.xml'),
  };
}
