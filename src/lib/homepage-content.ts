import 'server-only';
import { cache } from 'react';
import { prisma } from './db';

export const defaultHomePageContent = {
  id: 'global',
  eyebrow: 'PIZZERIA ROMA · NAMUR',
  title: 'De véritables saveurs italiennes à Namur',
  intro: 'Pizzas artisanales, pâtes, salades et bien plus encore. À emporter ou en livraison, toujours avec passion.',
  primaryLabel: 'Découvrir la carte',
  secondaryLabel: 'Voir la carte',
  heroImage: '/roma-hero.png',
  aboutTitle: 'Une histoire de famille, de passion et de tradition',
  aboutTextOne: 'Présente dans le Namurois depuis 2003, la Pizzeria Roma cultive une ambiance familiale et le goût des traditions culinaires italiennes.',
  aboutTextTwo: 'Livraison, plats à emporter et recettes préparées avec soin : découvrez l’histoire qui nous lie à nos clients depuis plus de vingt ans.',
  metaTitle: 'Pizza italienne à Namur depuis 2003',
  metaDescription: 'Découvrez les pizzas, pâtes et spécialités de Pizzeria Roma à Namur. À emporter ou en livraison.',
  revision: 0,
};

export const getHomePageContent = cache(async function getHomePageContent() {
  try {
    const rows = await prisma.$queryRaw<Array<typeof defaultHomePageContent>>`
      SELECT "id", "eyebrow", "title", "intro", "primaryLabel", "secondaryLabel", "heroImage",
        "aboutTitle", "aboutTextOne", "aboutTextTwo", "metaTitle", "metaDescription", "revision"
      FROM "HomePageContent" WHERE "id" = 'global' LIMIT 1`;
    return rows[0] ?? defaultHomePageContent;
  } catch {
    // Keep the public homepage available if the content table is not reachable.
    return defaultHomePageContent;
  }
});
