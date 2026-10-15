import Link from 'next/link';

export const metadata = {
  title: 'Personnaliser une pizza | Pizzeria Roma',
  description: 'Aperçu des options de personnalisation des pizzas. Commandes indisponibles.',
};

export default function CustomizePizzaPage() {
  return (
    <main className="customize-page">
      <div className="customize-panel">
        <Link href="/menu" className="customize-back">← Retour à la carte</Link>
        <p className="eyebrow">À VOTRE GOÛT</p>
        <h1>Votre pizza,<br/>votre façon.</h1>
        <p>Choisissez une recette publiée sur la carte pour ajuster le format, retirer les ingrédients proposés et ajouter vos suppléments.</p>
        <section aria-label="Personnalisation">
          <h2>Comment ça marche ?</h2>
          <ul>
            <li>Choisissez le format disponible pour la recette.</li>
            <li>Retirez les ingrédients autorisés, sans réduction du prix.</li>
            <li>Ajoutez les suppléments disponibles ; leur tarif s’ajoute au total.</li>
          </ul>
          <p className="customize-warning">La carte publiée par le restaurant détermine les choix et les prix. Les commandes en ligne restent en mode test.</p>
        </section>
        <Link href="/menu#carte" className="customize-link">Choisir une pizza <span aria-hidden="true">↗</span></Link>
      </div>
    </main>
  );
}
