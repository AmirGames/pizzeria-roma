import type { MetadataRoute } from 'next';
import { absoluteSiteUrl } from '../lib/site-seo';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: absoluteSiteUrl('/'), changeFrequency: 'monthly', priority: 1 },
    { url: absoluteSiteUrl('/a-propos'), changeFrequency: 'yearly', priority: 0.8 },
    { url: absoluteSiteUrl('/menu'), changeFrequency: 'weekly', priority: 0.9 },
    { url: absoluteSiteUrl('/contact'), changeFrequency: 'yearly', priority: 0.7 },
  ];
}
