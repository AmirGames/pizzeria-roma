import Link from 'next/link';

const categories = [
  { label: 'Pizzas', detail: '33 cm et 50 cm — recettes à confirmer' },
  { label: 'Pâtes', detail: 'Carte en préparation' },
  { label: 'Entrées', detail: 'Carte en préparation' },
  { label: 'Salades', detail: 'Carte en préparation' },
  { label: 'Desserts', detail: 'Carte en préparation' },
  { label: 'Boissons', detail: 'Carte en préparation' },
];

export const metadata = {
  title: 'Carte en préparation | Pizzeria Roma',
  description: 'Découvrez prochainement la carte de Pizzeria Roma à Namur.',
};

export default function MenuPage() {
  return (
    <main className="menu-page">
      <header className="menu-header">
        <Link href="/" className="brand">ROMA<span>PIZZERIA · NAMUR</span></Link>
        <span className="menu-status">Commande en ligne bientôt disponible</span>
      </header>
      <section className="menu-hero">
        <p className="eyebrow">LA CARTE</p>
        <h1>Une cuisine généreuse, à partager.</h1>
        <p>Nous préparons notre nouvelle carte en ligne. Les plats, prix et allergènes seront publiés après validation par le restaurant.</p>
        <span className="menu-chip">Livraison & retrait · Prochainement</span>
      </section>
      <div style={{ textAlign: "center", padding: "30px 20px 0" }}><Link href="/menu/personnaliser" className="customize-link">Découvrir la personnalisation des pizzas →</Link></div>
      <section className="menu-categories" aria-labelledby="categories-title">
        <div className="section-heading">
          <p className="eyebrow">DÉCOUVRIR</p>
          <h2 id="categories-title">Nos catégories</h2>
        </div>
        <div className="category-grid">
          {categories.map((category, index) => (
            <article className="category-card" key={category.label}>
              <div className="category-art" aria-hidden="true"><span>{String(index + 1).padStart(2, '0')}</span></div>
              <div className="category-content"><h3>{category.label}</h3><p>{category.detail}</p></div>
            </article>
          ))}
        </div>
      </section>
      <footer className="menu-footer">Pizzeria Roma · Namur · Site en préparation — aucune commande ni paiement disponible.</footer>
    </main>
  );
}
