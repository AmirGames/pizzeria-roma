# Roadmap GitHub

## État des pull requests

Les PR GitHub **#1 à #13 sont fusionnées**. Les jalons produit ci-dessous décrivent le travail restant et ne reprennent pas nécessairement la numérotation des PR.

- [x] PR #1–#8 : fondations, catalogue, personnalisation, panier de démonstration et règles de livraison/retrait.
- [x] PR #9 : connecter le panier de démonstration aux règles de livraison et de retrait.
- [x] PR #10 : aperçu serveur des sélections depuis le catalogue Prisma.
- [x] PR #11 : publier en lecture seule le catalogue actif.
- [x] PR #12 : ajouter les sélections du catalogue au panier et recalculer côté serveur les prix et règles.
- [x] PR #13 : aligner la roadmap et les règles commerciales.

## Prochain jalon — préparer le catalogue à partir du menu courant

La carte photographiée datée du 14/10/2026 a été transcrite dans [RESTAURANT_MENU_SOURCE.md](RESTAURANT_MENU_SOURCE.md).

- [ ] Ajouter un modèle de choix exclusifs pour les types de pâtes et recalculer leurs suppléments côté serveur.
- [ ] Vérifier comment représenter les suppléments pizza, dont la carte ne donne pas la liste ni les prix individuels.
- [ ] Saisir les catégories, produits, tailles et prix du menu daté dans le catalogue Prisma avec des tests de cohérence.
- [ ] Garder les catégories de fulfillment fiables côté serveur ; salades, viande, boissons et desserts restent `OTHER`. Ne pas modifier la règle concernant les desserts sans confirmation.
- [ ] Recueillir les allergènes et disponibilités auprès du restaurant avant de les afficher ou d'activer un service commercial.

Les règles de livraison et de retrait existantes restent inchangées. La transcription ne crée aucune commande réelle et n'active aucun paiement.

## Étapes suivantes après validation commerciale

- [ ] Vérifier une adresse à partir d'une source de couverture approuvée, sans faire confiance à la zone saisie par le client.
- [ ] Définir les horaires, créneaux, capacités et précommandes avec le restaurant.
- [ ] Concevoir la création et le suivi des commandes avec autorisation serveur et processus de cuisine.
- [ ] Étudier les paiements et remboursements après validation juridique, contractuelle et opérationnelle.
- [ ] Préparer le pilote, la surveillance et les sauvegardes avant toute mise en production.

À chaque PR : ajouter les tests appropriés, exécuter le typecheck et le build, et mettre à jour le README, le changelog et la documentation fonctionnelle concernée.
