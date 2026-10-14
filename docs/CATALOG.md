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
Voir `docs/PIZZA_CUSTOMIZATION.md`. Le devis vérifie les identifiants d'options contre un produit de confiance. Pas de tarification réelle ni d'API pour le moment.
