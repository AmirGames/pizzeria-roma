# Pizzeria Roma

Application de commande en ligne indépendante pour Pizzeria Roma (Namur).

## État

Le catalogue du menu communiqué le 14/10/2026 et un panier de prévisualisation sont en place. La livraison et le retrait restent des aperçus : aucune commande réelle, aucun paiement ni lancement de production n'est activé.

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

**Attention :** les comptes et les sessions ne sont pas encore utilisables. Les fichiers Prisma et les règles d'autorisation sont uniquement des fondations.

## Authentification

La vérification de session côté serveur est en cours de construction. Aucun formulaire de connexion ou inscription n'est actif. Ne pas considérer les comptes comme prêts pour la production.

## Catalogue du menu 2026

La carte datée du 14/10/2026 est transcrite dans [`docs/RESTAURANT_MENU_SOURCE.md`](docs/RESTAURANT_MENU_SOURCE.md) et structurée dans `prisma/menu-2026-10-14.mjs`. Après migration, `npm run db:seed` charge explicitement les produits sur la base pointée par `DATABASE_URL` ; le seed n'est jamais exécuté automatiquement. La fusion du code ne signifie pas que la base d'un environnement particulier a été amorcée.

Les formes de pâtes, la majoration tagliatelle, le choix de dessert et le supplément fromage exclusif sont tarifés côté serveur. Les suppléments pizza restent absents faute de liste et de prix individuels. Les allergènes ne sont pas déclarés ni déduits. Voir [`docs/CATALOG.md`](docs/CATALOG.md).

## Aperçu du menu

Démarrer avec `npm run dev` puis ouvrir `http://localhost:3000/menu`. La page affiche les produits, tailles et suppléments actifs publiés dans le catalogue Prisma. Les données du menu du 14/10/2026 ne sont visibles qu'après exécution explicite de `npm run db:seed` sur la base configurée. Si aucun produit n'a été publié ou si le catalogue est indisponible, la page affiche un état explicite. Aucun allergène n'est inventé et aucun achat n'est possible.

## Personnalisation des pizzas (préparation)

La page `/menu/personnaliser` présente les options prévues. Les modules de validation et de devis sont testés séparément. Le panier catalogue permet de revoir des sélections, mais n'envoie aucune commande. Voir [`docs/PIZZA_CUSTOMIZATION.md`](docs/PIZZA_CUSTOMIZATION.md).

## Panier

Ouvrir `/panier` pour tester le panier de démonstration, avec son article et son tarif fictifs, ses quantités, sa suppression et son commentaire local. Il reste séparé du panier catalogue. Les articles du menu peuvent être ajoutés à ce dernier sous forme d'identifiants ; l'API serveur relit les prix, options et règles. Aucune commande ni aucun paiement n'est créé. Voir [`docs/CART.md`](docs/CART.md).

## Livraison et retrait (aperçu)

La page `/commande` présente les règles selon le mode livraison/retrait et la zone choisie. Avec une sélection catalogue, les prix et l'éligibilité sont recalculés côté serveur. Le panier de démonstration reste une simulation locale. La route `POST /api/cart/preview` relit les produits et prix depuis Prisma ; `GET /api/catalog` ne retourne que les données actives.

**Règle confirmée :** seules les pizzas et les pâtes comptent dans le minimum de plats par zone. Namur centre = 1 plat ; Belgrade, Erpent et Saint-Servais = 2 plats. La livraison est gratuite. Une pizza maxi 50 cm compte pour 2 plats ; une pizza 33 cm compte pour 2 à partir de 18 € par pizza, suppléments inclus ; les pâtes comptent pour 1. Salades, boissons et desserts restent exclus. La règle concernant les desserts est inchangée.

Le choix d'une zone n'est pas une validation d'adresse. Les frontières géographiques, horaires, créneaux et capacités restent à confirmer avant tout checkout. Voir [`docs/FULFILLMENT.md`](docs/FULFILLMENT.md) et la [`roadmap`](docs/ROADMAP.md).
