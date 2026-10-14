# Panier — démonstration et catalogue

## Fonctionnement
- Page `/panier` avec un article et un prix fictifs, quantités, suppression et commentaire.
- Les lignes du panier de démonstration sont conservées dans le stockage local du navigateur pour rester disponibles sur `/commande` et après rechargement.
- Le panier partagé alimente l'aperçu de livraison/retrait : pizzas et pâtes sont comptées selon les règles existantes, tandis que les autres catégories restent exclues.
- Totaux en centimes et contrôles de forme des données restaurées.
- Les commentaires restent en mémoire de page et ne sont pas enregistrés.

## Limites de sécurité et de périmètre
Le panier de démonstration et ses prix sont contrôlés par le navigateur et ne constituent pas une source fiable. La carte publique affiche uniquement les données actives de Prisma. Le comptage et l'éligibilité du panier de démonstration restent un aperçu local. `GET /api/catalog` publie les éléments actifs de Prisma et `POST /api/cart/preview` recalcule le prix et l'éligibilité depuis les identifiants côté serveur. Le panier du catalogue stocke uniquement des identifiants et quantités ; les pages `/panier` et `/commande` demandent au serveur de recalculer prix et règles. Le panier de démonstration reste séparé.

Aucune adresse n'est validée, aucun créneau n'est réservé, aucune commande n'est enregistrée et aucun paiement n'est activé. Le commentaire reste limité au panier de démonstration et n'est ni soumis ni persisté. L'API de prévisualisation relit choix et prix depuis Prisma pour le panier catalogue.

## Prochaines étapes
- Obtenir et charger le menu commercial approuvé dans la base, maintenir le catalogue commercial approuvé à jour dans la base.
- Ajouter des produits réels configurés (tailles, suppléments et retraits).
- Persistance contrôlée du panier, contrôles de disponibilité et devis serveur.
- Validation serveur de la couverture, créneaux, capacité et commande avant tout paiement.


## Catalogue public — PR-11
La route `GET /api/catalog` et la section « Les plats disponibles » de `/menu` lisent les produits, tailles et suppléments actifs depuis Prisma. Les prix sont ceux de la base ; si aucune donnée n'est publiée, le site affiche un message de préparation. Aucun ajout panier, aucune commande, aucun paiement et aucun changement à la règle des desserts.


## Panier relié au catalogue — PR-12
Les cartes de `/menu` permettent de choisir une taille et des suppléments actifs, puis ajoutent au stockage local uniquement les IDs produit/taille/suppléments et la quantité. Les prix ne sont jamais persistés par le navigateur. `/panier` et `/commande` envoient ces sélections à `POST /api/cart/preview` pour relire le catalogue et calculer le sous-total ainsi que les règles de retrait/livraison. Le panier de démonstration reste séparé et fonctionne en local. Aucun envoi de commande, paiement, adresse ou créneau réel n'est activé ; la classification et la règle des desserts sont inchangées.
