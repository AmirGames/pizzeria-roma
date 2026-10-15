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
        <p>Choisissez une pizza sur la carte, retirez les ingrédients proposés et ajoutez les suppléments disponibles. Le prix se met à jour avec vos choix.</p>
        <section aria-label="Options à venir">
          <h2>Personnalisez votre recette</h2>
          <ul>
            <li>Choix de la taille : 33 cm ou 50 cm</li>
            <li>Suppléments selon la recette</li>
            <li>Retrait d’ingrédients autorisés</li>
          </ul>
          <p className="customize-warning">Retirer un ingrédient ne réduit pas le prix. Les suppléments augmentent le prix selon les tarifs publiés. Les commandes restent désactivées.</p>
        </section>
        <Link href="/menu" className="customize-link">Voir les catégories</Link>
      </div>
    </main>
  );
}
