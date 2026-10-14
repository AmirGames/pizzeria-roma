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
Schéma des options et calculateur isolé ajoutés ; pas encore de catalogue interactif, d'API ou de commandes réelles.

## Interface PR-04b
Page `/menu` responsive : catégories uniquement, sans fiches produits ni tarifs inventés. Aucun panier ou paiement. Les photographies et les informations de menu seront fournies/validées par le restaurant.

## Personnalisation PR-06
Voir `docs/PIZZA_CUSTOMIZATION.md`. Le devis vérifie les identifiants d'options contre un produit de confiance. Pas de tarification réelle ni d'API de catalogue connectée à la page du menu.


## PR-10 — Aperçu panier côté serveur
- L'API `POST /api/cart/preview` accepte les identifiants des produits/options et les quantités. Elle lit prix, catégories, tailles et suppléments dans Prisma et retourne un récapitulatif sans créer de commande.
- Le modèle de catégorie porte une classification de fulfillment explicite : `PIZZA`, `PASTA` ou `OTHER`. Les catégories existantes et futures valent `OTHER` par défaut ; les catégories desserts ne sont pas reclassées.
- La classification est utilisée côté serveur uniquement. Le navigateur ne peut pas envoyer son propre prix, sa catégorie ou sa taille pour modifier le calcul. Les catégories existantes migrent en `OTHER` et restent exclues jusqu'à ce qu'une classification fiable ait été renseignée côté base.
- La base ne contient toujours pas de menu commercial approuvé. Les produits des tests sont des fixtures et ne sont jamais exposés par l'application.
