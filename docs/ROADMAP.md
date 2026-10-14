# Roadmap GitHub

## État des pull requests

Les PR GitHub **#1 à #12 sont fusionnées**. Les jalons produit ci-dessous sont des travaux restant à réaliser ; leur numéro ne correspond pas nécessairement au numéro des PR GitHub.

- [x] PR #1–#8 : fondations, catalogue, personnalisation, panier de démonstration et règles de livraison/retrait.
- [x] PR #9 : connecter le panier de démonstration aux règles de livraison et de retrait.
- [x] PR #10 : aperçu serveur des sélections depuis le catalogue Prisma.
- [x] PR #11 : publier en lecture seule le catalogue actif.
- [x] PR #12 : ajouter les sélections du catalogue au panier et recalculer côté serveur les prix et règles.

## Prochain jalon — préparer le catalogue commercial

- [ ] Obtenir de la pizzeria la carte, les tailles, prix, suppléments, allergènes et disponibilités approuvés.
- [ ] Saisir et vérifier ces données dans le catalogue Prisma avant publication.
- [ ] Confirmer les zones et leurs limites géographiques avant toute activation de livraison.
- [ ] Garder les catégories de fulfillment fiables côté serveur ; les catégories non classées restent `OTHER`. Ne pas modifier la règle concernant les desserts sans confirmation.

Tant que ces informations ne sont pas validées, ne pas inventer de produits ou de prix et ne pas activer les commandes réelles ou les paiements.

## Étapes suivantes après validation commerciale

- [ ] Vérifier une adresse à partir d'une source de couverture approuvée, sans faire confiance à la zone saisie par le client.
- [ ] Définir les horaires, créneaux, capacités et précommandes avec le restaurant.
- [ ] Concevoir la création et le suivi des commandes avec autorisation serveur et processus de cuisine.
- [ ] Étudier les paiements et remboursements après validation juridique, contractuelle et opérationnelle.
- [ ] Préparer le pilote, la surveillance et les sauvegardes avant toute mise en production.

À chaque PR : ajouter les tests appropriés, exécuter le typecheck et le build, et mettre à jour le README, le changelog et la documentation fonctionnelle concernée.
