import CatalogProducts from './catalog-products';
import { loadPublicCatalog } from '../../lib/public-catalog-data';
import type { PublicCatalogCategory } from '../../lib/public-catalog-data';
import { realOrdersEnabled, stripeReady } from '../../lib/real-orders';

export const metadata = {
  title: 'Notre carte | Pizzeria Roma',
  description: 'Découvrez la carte publiée de Pizzeria Roma à Namur.',
};

export default async function MenuPage() {
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
        <h1>Notre carte</h1>
        <p>Découvrez nos pizzas, pâtes, salades et spécialités italiennes.</p></div>
      </section>
      <section className="menu-live-catalog" id="carte" aria-label="Carte des plats">
        <p className="menu-notice">{categories.length === 0
          ? 'La carte est en cours de préparation. Pour les allergènes, contactez le restaurant.'
          : orderingEnabled
            ? 'Carte publiée et commandes en ligne disponibles. Les informations sur les allergènes sont disponibles auprès du restaurant.'
            : 'Carte publiée. Les commandes en ligne et le paiement sécurisé seront disponibles après la configuration finale. Pour les allergènes, contactez le restaurant.'}</p>
        <CatalogProducts initialCategories={categories} />
      </section>
    </main>
  );
}
