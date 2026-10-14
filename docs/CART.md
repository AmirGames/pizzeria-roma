# Panier de démonstration — PR-07 et PR-09

## Fonctionnement
- Page `/panier` avec un article et un prix fictifs, quantités, suppression et commentaire.
- Les lignes du panier de démonstration sont conservées dans le stockage local du navigateur pour rester disponibles sur `/commande` et après rechargement.
- Le panier partagé alimente l'aperçu de livraison/retrait : pizzas et pâtes sont comptées selon les règles existantes, tandis que les autres catégories restent exclues.
- Totaux en centimes et contrôles de forme des données restaurées.
- Les commentaires restent en mémoire de page et ne sont pas enregistrés.

## Limites de sécurité et de périmètre
Le panier et ses prix sont contrôlés par le navigateur et ne constituent pas une source fiable. Le catalogue reste fictif : aucun vrai article ni prix commercial n'est publié. Le comptage et l'éligibilité visibles dans l'interface ne sont qu'un aperçu local. Une future API devra charger les articles, catégories, tailles et prix depuis Prisma, vérifier la disponibilité, puis recalculer les montants et règles côté serveur.

Aucune adresse n'est validée, aucun créneau n'est réservé, aucune commande n'est enregistrée et aucun paiement n'est activé. Le commentaire n'est ni soumis ni persisté.

## Prochaines étapes
- Alimenter la carte depuis des produits approuvés en base.
- Ajouter des produits réels configurés (tailles, suppléments et retraits).
- Persistance contrôlée du panier, contrôles de disponibilité et devis serveur.
- Validation serveur de la couverture, créneaux, capacité et commande avant tout paiement.
