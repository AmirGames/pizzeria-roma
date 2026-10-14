# Roadmap GitHub

## État des pull requests

Les PR GitHub **#1 à #14 sont fusionnées**. Les jalons produit ci-dessous décrivent le travail restant et ne reprennent pas nécessairement la numérotation des PR.

- [x] PR #1–#8 : fondations, catalogue, personnalisation, panier de démonstration et règles de livraison/retrait.
- [x] PR #9 : connecter le panier de démonstration aux règles de livraison et de retrait.
- [x] PR #10 : aperçu serveur des sélections depuis le catalogue Prisma.
- [x] PR #11 : publier en lecture seule le catalogue actif.
- [x] PR #12 : ajouter les sélections du catalogue au panier et recalculer côté serveur les prix et règles.
- [x] PR #13 : aligner la roadmap et les règles commerciales.
- [x] PR #14 : transcrire le menu daté du 14/10/2026.

## Jalon en cours — catalogue du menu actuel

La carte est transcrite dans [RESTAURANT_MENU_SOURCE.md](RESTAURANT_MENU_SOURCE.md) et les données structurées dans `prisma/menu-2026-10-14.mjs).

- [ ] PR #15 : représenter les choix exclusifs et leurs prix côté serveur, ajouter le seed, tests et affichage des choix.
- [ ] Obtenir la liste et les prix individuels des suppléments pizza avant de les ajouter.
- [ ] Confirmer les allergènes et disponibilités auprès du restaurant avant leur publication.
- [ ] Garder les catégories de fulfillment fiables côté serveur ; salades, viande, boissons et desserts restent `OTHER`. Ne pas modifier la règle concernant les desserts sans confirmation.

Le seed n'est exécuté par aucune étape de build ou de déploiement ; il faut le lancer explicitement sur une base où l'on veut charger les produits. Les règles de livraison et retrait restent inchangées. Aucune commande réelle ni aucun paiement n'est activé.

## Étapes suivantes après validation commerciale

- [ ] Vérifier une adresse à partir d'une source de couverture approuvée, sans faire confiance à la zone saisie par le client.
- [ ] Définir les horaires, créneaux, capacités et précommandes avec le restaurant.
- [ ] Concevoir la création et le suivi des commandes avec autorisation serveur et processus de cuisine.
- [ ] Étudier les paiements et remboursements après validation juridique, contractuelle et opérationnelle.
- [ ] Préparer le pilote, la surveillance et les sauvegardes avant toute mise en production.

À chaque PR : ajouter les tests appropriés, exécuter le typecheck et le build, et mettre à jour le README, le changelog et la documentation fonctionnelle concernée.
