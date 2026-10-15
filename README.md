# Pizzeria Roma

Application de commande en ligne indépendante pour Pizzeria Roma (Namur).

## État

Le catalogue du menu communiqué le 14/10/2026 et un panier de prévisualisation sont en place. Un espace client et des commandes simulées sont disponibles après activation explicite du mode test. La livraison et le retrait restent des aperçus : aucune commande réelle, aucun paiement ni lancement de production n'est activé.

## Objectifs

- Site client responsive et PWA, français et anglais.
- Catalogue et personnalisation des pizzas.
- Livraison par zones et retrait sur place.
- Paiement en ligne sécurisé et acceptation manuelle, après validation juridique et opérationnelle.
- Espace gérant et cuisine.

## Méthode

Développement par pull requests avec tests, revue et mise à jour de la documentation. Voir [`docs/`](docs/) pour les exigences, règles et jalons.

## Confidentialité

Ne jamais committer de secrets, clés API, coordonnées bancaires ou données réelles de clients.

## Développement local (préparation)

- Node.js 22, npm et Docker requis.
- `npm install`, `npm run typecheck`, `npm test`, `npm run build`.
- Pour préparer PostgreSQL : définir `POSTGRES_PASSWORD` et `DATABASE_URL` localement, puis `docker compose up -d db` et `npm run db:validate`.
- Ne pas exécuter de migration en production avant revue et validation.

L’espace gérant permet de créer des pizzas en brouillon, de gérer les prix et options et de rechercher un article. Un accès privé par lien à usage unique est disponible après configuration du serveur. La connexion client et l’inscription sont disponibles uniquement dans le mode test explicite.

## Authentification

L’espace `/gerant/carte` utilise des sessions vérifiées côté serveur et une connexion par lien privé généré depuis un terminal de confiance. Voir [la configuration gérant](docs/MANAGER.md). Aucun accès gérant n’est créé automatiquement au déploiement. Le mode `ENABLE_TEST_ORDERS=true` ajoute les comptes clients de test, avec inscription/connexion par mot de passe ; voir [CUSTOMER_TESTS.md](docs/CUSTOMER_TESTS.md).

## Catalogue du menu 2026

La carte datée du 14/10/2026 est transcrite dans [`docs/RESTAURANT_MENU_SOURCE.md`](docs/RESTAURANT_MENU_SOURCE.md) et structurée dans `prisma/menu-2026-10-14.mjs`. Après migration, `npm run db:seed` charge explicitement les produits sur la base pointée par `DATABASE_URL` ; le seed n'est jamais exécuté automatiquement. La fusion du code ne signifie pas que la base d'un environnement particulier a été amorcée.

Les formes de pâtes, la majoration tagliatelle, le choix de dessert et le supplément fromage exclusif sont tarifés côté serveur. Les suppléments pizza restent absents faute de liste et de prix individuels. Les allergènes ne sont pas déclarés ni déduits. Voir [`docs/CATALOG.md`](docs/CATALOG.md).

## Aperçu du menu

Démarrer avec `npm run dev` puis ouvrir `http://localhost:3000/menu`. La page affiche les produits, tailles et suppléments actifs publiés dans le catalogue Prisma. Les données du menu du 14/10/2026 ne sont visibles qu'après exécution explicite de `npm run db:seed` sur la base configurée. Si aucun produit n'a été publié ou si le catalogue est indisponible, la page affiche un état explicite. Aucun allergène n'est inventé et aucun achat n'est possible.

## Personnalisation des pizzas

La carte permet de retirer les ingrédients configurés sans réduction de prix et de sélectionner des suppléments avec prix fixe ou par format. Le panier conserve les recettes distinctes et le serveur recalcule les montants. Les compositions et tarifs des suppléments restent à renseigner dans l’espace gérant ; aucune commande n’est envoyée. Voir [`docs/PIZZA_CUSTOMIZATION.md`](docs/PIZZA_CUSTOMIZATION.md).

## Panier

Ouvrir `/panier` pour tester le panier de démonstration, avec son article et son tarif fictifs, ses quantités, sa suppression et son commentaire local. Il reste séparé du panier catalogue. Les recettes peuvent être modifiées directement depuis le panier catalogue, avec validation serveur et conservation des quantités. Les articles du menu peuvent être ajoutés à ce dernier sous forme d'identifiants ; l'API serveur relit les prix, options et règles. Aucune commande ni aucun paiement n'est créé. Voir [`docs/CART.md`](docs/CART.md).

## Livraison et retrait (aperçu)

La page `/commande` présente les règles selon le mode livraison/retrait et la zone choisie. Avec une sélection catalogue, les prix et l'éligibilité sont recalculés côté serveur. Le panier de démonstration reste une simulation locale. La route `POST /api/cart/preview` relit les produits et prix depuis Prisma ; `GET /api/catalog` ne retourne que les données actives. Un indicateur informatif d'ouverture suit les horaires habituels et le service 18h–22h des jours fériés légaux belges dans le fuseau `Europe/Brussels` ; le dimanche reste fermé. Les éventuels jours de remplacement ou exceptions propres au restaurant doivent être confirmés. L’indicateur ne réserve aucun créneau et ne rend pas les commandes disponibles.

**Règle confirmée :** seules les pizzas et les pâtes comptent dans le minimum de plats par zone. Namur centre = 1 plat ; Belgrade, Erpent et Saint-Servais = 2 plats. La livraison est gratuite. Une pizza maxi 50 cm compte pour 2 plats ; une pizza 33 cm compte pour 2 à partir de 18 € par pizza, suppléments inclus ; les pâtes comptent pour 1. Salades, boissons et desserts restent exclus. La règle concernant les desserts est inchangée.

Le choix d'une zone n'est pas une validation d'adresse. Les frontières géographiques, horaires, créneaux et capacités restent à confirmer avant tout checkout. Voir [`docs/FULFILLMENT.md`](docs/FULFILLMENT.md) et la [`roadmap`](docs/ROADMAP.md).

## Espace client et commandes de test

En local, ajouter `ENABLE_TEST_ORDERS=true` et `APP_ORIGIN=http://localhost:3000` dans `.env`, appliquer les migrations puis démarrer `npm run dev`. Utiliser `/compte` pour s’inscrire, `/commande/test` pour confirmer un essai et `/gerant/commandes-test` pour simuler son suivi côté professionnel. Les essais sont stockés séparément des commandes commerciales. Aucun paiement, e-mail ou ordre de préparation réelle n’est envoyé. Les compositions et suppléments doivent être configurés dans la carte. Voir [le guide du mode test](docs/CUSTOMER_TESTS.md).
