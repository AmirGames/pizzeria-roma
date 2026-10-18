import CatalogProducts from './catalog-products';
import { loadPublicCatalog } from '../../lib/public-catalog-data';
import type { PublicCatalogCategory } from '../../lib/public-catalog-data';
import { realOrdersEnabled, stripeReady } from '../../lib/real-orders';
import { publicPageMetadata } from '../../lib/site-seo';
import { getSiteLocale } from '../../lib/locale';
import { getMessages } from '../../i18n/messages';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  const en = (await getSiteLocale()) === 'en';
  return publicPageMetadata(
    en ? 'Pizza and pasta menu in Namur' : 'Carte de pizzas et pâtes à Namur',
    en ? 'Browse the Pizzeria Roma menu: pizza, pasta, starters, salads, desserts and drinks in Namur.' : 'Parcourez la carte de Pizzeria Roma : pizzas, pâtes, entrées, salades, desserts et boissons à Namur.',
    '/menu',
    en ? 'en' : 'fr',
  );
}

export default async function MenuPage() {
  const locale = await getSiteLocale();
  const t = getMessages(locale).menu;
  const orderingEnabled = realOrdersEnabled() && stripeReady();
  let categories: PublicCatalogCategory[] = [];
  try {
    categories = await loadPublicCatalog();
  } catch (error) {
    console.error('[menu] Failed to render the public catalog:', error);
  }
  return (
    <main className="menu-page">
      <section className="menu-hero">
        <div><p className="eyebrow">PIZZERIA ROMA · NAMUR</p>
        <h1>{t.title}</h1>
        <p>{t.intro}</p></div>
      </section>
      <section className="menu-live-catalog" id="carte" aria-label={t.itemsLabel}>
        <p className="menu-notice">{categories.length === 0
          ? t.noticeEmpty
          : orderingEnabled
            ? t.noticeOpen
            : t.noticeSetup}</p>
        <CatalogProducts initialCategories={categories} locale={locale} />
      </section>
    </main>
  );
}
