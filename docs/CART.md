# Panier de démonstration — PR-07 et PR-09

## Fonctionnement
- Page `/panier` avec un article et un prix fictifs, quantités, suppression et commentaire.
- Les lignes du panier de démonstration sont conservées dans le stockage local du navigateur pour rester disponibles sur `/commande` et après rechargement.
- Le panier partagé alimente l'aperçu de livraison/retrait : pizzas et pâtes sont comptées selon les règles existantes, tandis que les autres catégories restent exclues.
- Totaux en centimes et contrôles de forme des données restaurées.
- Les commentaires restent en mémoire de page et ne sont pas enregistrés.

## Limites de sécurité et de périmètre
Le panier et ses prix sont contrôlés par le navigateur et ne constituent pas une source fiable. Le catalogue reste fictif : aucun vrai article ni prix commercial n'est publié. Le comptage et l'éligibilité visibles dans l'interface ne sont qu'un aperçu local. `GET /api/catalog` publie les éléments actifs de Prisma et `POST /api/cart/preview` recalcule le prix et l'éligibilité depuis les identifiants côté serveur. L'interface panier reste une démonstration et n'appelle pas encore ces API.

Aucune adresse n'est validée, aucun créneau n'est réservé, aucune commande n'est enregistrée et aucun paiement n'est activé. Le commentaire n'est ni soumis ni persisté. Une API de prévisualisation serveur distincte relit les choix et prix depuis Prisma, mais n'est pas encore branchée à l'interface ni à un catalogue rempli.

## Prochaines étapes
- Obtenir et charger le menu commercial approuvé dans la base, puis remplacer le panier de démonstration par des sélections d'articles et connecter l'aperçu serveur.
- Ajouter des produits réels configurés (tailles, suppléments et retraits).
- Persistance contrôlée du panier, contrôles de disponibilité et devis serveur.
- Validation serveur de la couverture, créneaux, capacité et commande avant tout paiement.


## Catalogue public — PR-11
La route `GET /api/catalog` et la section « Les plats disponibles » de `/menu` lisent les produits, tailles et suppléments actifs depuis Prisma. Les prix sont ceux de la base ; si aucune donnée n'est publiée, le site affiche un message de préparation. Aucun ajout panier, aucune commande, aucun paiement et aucun changement à la règle des desserts.
