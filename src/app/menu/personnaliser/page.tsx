import Link from 'next/link';

export const metadata = {
  title: 'Personnaliser une pizza | Pizzeria Roma',
  description: 'Aperçu des options de personnalisation des pizzas. Commandes indisponibles.',
};

export default function CustomizePizzaPage() {
  return (
    <main className="customize-page">
      <Link href="/menu" className="customize-back">← Retour à la carte</Link>
      <div className="customize-panel">
        <p className="eyebrow">PIZZERIA ROMA · NAMUR</p>
        <h1>Votre pizza, à votre goût.</h1>
        <p>La personnalisation sera disponible après validation de la carte et des allergènes par le restaurant.</p>
        <section aria-label="Options à venir">
          <h2>Les options prévues</h2>
          <ul>
            <li>Choix de la taille : 33 cm ou 50 cm</li>
            <li>Suppléments selon la recette</li>
            <li>Retrait d’ingrédients autorisés</li>
          </ul>
          <p className="customize-warning">Aucun produit ni prix réel n'est encore publié. Les commandes sont désactivées.</p>
        </section>
        <Link href="/menu" className="customize-link">Voir les catégories</Link>
      </div>
    </main>
  );
}
