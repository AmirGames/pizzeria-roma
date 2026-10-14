# Catalogue et tarification — PR-03

## Modèle cible
- Catégories et produits FR/EN.
- Tailles 33 cm et 50 cm, prix par taille provenant de la base de données.
- Suppléments facultatifs, prix provenant de la base de données.
- Retraits d'ingrédients sans remise automatique.
- Disponibilité contrôlée par le gérant.

## Décisions à valider
- Menu et tarifs réels du restaurant.
- Liste des allergènes approuvée par le restaurant.
- Prix et règles des pizzas moitié-moitié.
- Combinaisons autorisées de suppléments et tailles.

## Sécurité
Le module `menu-pricing.mjs` calcule uniquement des centimes entiers. Il ne doit **jamais** recevoir des prix fournis par le navigateur : un futur service serveur doit lire les tarifs en base et vérifier que les options appartiennent au produit, sont actives et sont compatibles.

## État
Le catalogue actif est publié en lecture seule par `GET /api/catalog` et affiché sur `/menu`. Aucun produit commercial n'est ajouté automatiquement ; la page reste dans son état vide jusqu'à validation et chargement des données. Aucune commande réelle n'est possible.

## Interface PR-04b
Page `/menu` responsive : catégories de présentation et produits provenant du catalogue Prisma lorsqu'ils sont actifs. Les prix des tailles et suppléments viennent de la base. Aucun contenu commercial n'est inventé ; les photos, allergènes et le menu doivent être approuvés par le restaurant.

## Personnalisation PR-06
Voir `docs/PIZZA_CUSTOMIZATION.md`. Le devis vérifie les identifiants d'options contre un produit de confiance. L'API de prévisualisation des prix existe ; la carte publique en lecture seule est connectée à `/menu`.


## PR-10 — Aperçu panier côté serveur
- L'API `POST /api/cart/preview` accepte les identifiants des produits/options et les quantités. Elle lit prix, catégories, tailles et suppléments dans Prisma et retourne un récapitulatif sans créer de commande.
- Le modèle de catégorie porte une classification de fulfillment explicite : `PIZZA`, `PASTA` ou `OTHER`. Les catégories existantes et futures valent `OTHER` par défaut ; les catégories desserts ne sont pas reclassées.
- La classification est utilisée côté serveur uniquement. Le navigateur ne peut pas envoyer son propre prix, sa catégorie ou sa taille pour modifier le calcul. Les catégories existantes migrent en `OTHER` et restent exclues jusqu'à ce qu'une classification fiable ait été renseignée côté base.
- La base ne contient toujours pas de menu commercial approuvé. Les produits des tests sont des fixtures et ne sont jamais exposés par l'application.


## PR-11 — Catalogue public
- `GET /api/catalog` ne publie que les produits, tailles et suppléments actifs et leurs données d'affichage/prix issues de Prisma.
- La réponse n'expose ni la catégorie de fulfillment ni les enregistrements désactivés ; les catégories vides/non classées sont omises.
- `/menu` affiche les entrées publiées, ou un état vide/indisponible. Aucun jeu de données commercial fictif n'est ajouté.
- Le menu n'ajoute pas au panier et n'ouvre pas de commande. La connexion du panier à la prévisualisation serveur reste une étape suivante.
