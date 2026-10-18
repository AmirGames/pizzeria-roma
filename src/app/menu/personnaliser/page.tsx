import Link from 'next/link';
import { getSiteLocale } from '../../../lib/locale';
import { realOrdersEnabled, stripeReady } from '../../../lib/real-orders';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  const en = (await getSiteLocale()) === 'en';
  return {
    title: `${en ? 'Customize a pizza' : 'Personnaliser une pizza'} | Pizzeria Roma`,
    description: en ? 'See how to customize pizzas from the Pizzeria Roma menu.' : 'Aperçu des options de personnalisation des pizzas de la carte Pizzeria Roma.',
    robots: { index: false, follow: false },
  };
}

export default async function CustomizePizzaPage() {
  const en = (await getSiteLocale()) === 'en';
  const orderingAvailable = realOrdersEnabled() && stripeReady();
  return (
    <main className="customize-page">
      <div className="customize-panel">
        <Link href="/menu" className="customize-back">← {en ? 'Back to the menu' : 'Retour à la carte'}</Link>
        <p className="eyebrow">{en ? 'MADE YOUR WAY' : 'À VOTRE GOÛT'}</p>
        <h1>{en ? <>Your pizza,<br/>your way.</> : <>Votre pizza,<br/>votre façon.</>}</h1>
        <p>{en ? 'Choose a published recipe to select its size, remove available ingredients and add extras.' : 'Choisissez une recette publiée sur la carte pour ajuster le format, retirer les ingrédients proposés et ajouter vos suppléments.'}</p>
        <section aria-label={en ? 'How customization works' : 'Personnalisation'}>
          <h2>{en ? 'How does it work?' : 'Comment ça marche ?'}</h2>
          <ul>
            <li>{en ? 'Choose an available size for the recipe.' : 'Choisissez le format disponible pour la recette.'}</li>
            <li>{en ? 'Remove the listed ingredients; the price stays the same.' : 'Retirez les ingrédients autorisés, sans réduction du prix.'}</li>
            <li>{en ? 'Add available extras; their price is added to the total.' : 'Ajoutez les suppléments disponibles ; leur tarif s’ajoute au total.'}</li>
          </ul>
          <p className="customize-warning">{en ? orderingAvailable ? 'The published menu determines the available choices and prices. They are checked again before payment.' : 'The published menu determines the available choices and prices. Online orders are not open yet.' : orderingAvailable ? 'La carte publiée détermine les choix et les prix. Ils sont vérifiés à nouveau avant le paiement.' : 'La carte publiée par le restaurant détermine les choix et les prix. Les commandes en ligne restent en mode test.'}</p>
        </section>
        <Link href="/menu#carte" className="customize-link">{en ? 'Choose a pizza' : 'Choisir une pizza'} <span aria-hidden="true">↗</span></Link>
      </div>
    </main>
  );
}
