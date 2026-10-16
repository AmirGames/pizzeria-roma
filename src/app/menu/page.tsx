import CatalogProducts from './catalog-products';

export const metadata = {
  title: 'Notre carte | Pizzeria Roma',
  description: 'Découvrez la carte publiée de Pizzeria Roma à Namur.',
};

export default function MenuPage() {
  return (
    <main className="menu-page">
      <section className="menu-hero">
        <div><p className="eyebrow">PIZZERIA ROMA · NAMUR</p>
        <h1>Notre carte</h1>
        <p>Découvrez nos pizzas, pâtes, salades et spécialités italiennes.</p></div>
      </section>
      <section className="menu-live-catalog" id="carte" aria-label="Carte des plats">
        <p className="menu-notice">La carte présente les catégories et les plats publiés. Les prix et allergènes seront publiés après validation. Pour le moment, aucune commande ni paiement disponible.</p>
        <CatalogProducts />
      </section>
    </main>
  );
}
