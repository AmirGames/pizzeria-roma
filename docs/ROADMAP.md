# Roadmap GitHub

## État des pull requests

Les PR GitHub **#1 à #15 sont fusionnées**. Les jalons produit ci-dessous décrivent le travail restant et ne reprennent pas nécessairement la numérotation des PR.

- [x] PR #1–#8 : fondations, catalogue, personnalisation, panier de démonstration et règles de livraison/retrait.
- [x] PR #9 : connecter le panier de démonstration aux règles de livraison et de retrait.
- [x] PR #10 : aperçu serveur des sélections depuis le catalogue Prisma.
- [x] PR #11 : publier en lecture seule le catalogue actif.
- [x] PR #12 : ajouter les sélections du catalogue au panier et recalculer côté serveur les prix et règles.
- [x] PR #13 : aligner la roadmap et les règles commerciales.
- [x] PR #14 : transcrire le menu daté du 14/10/2026.
- [x] PR #15 : charger explicitement les 88 produits, tarifs et choix confirmés du menu 2026 dans le catalogue.

## Catalogue du menu actuel — PR #15 fusionnée

La carte est transcrite dans [RESTAURANT_MENU_SOURCE.md](RESTAURANT_MENU_SOURCE.md) et les données structurées dans `prisma/menu-2026-10-14.mjs`. Après migration, le seed doit être lancé explicitement sur la base voulue ; aucune étape de build ou de déploiement ne le lance automatiquement. La fusion de la PR ne prouve pas que la base d’un environnement particulier a été amorcée.

- [x] Représenter côté serveur les choix de pâtes, les tarifs tagliatelle, les choix de desserts et le supplément fromage exclusif.
- [ ] Obtenir du restaurant la liste et les prix individuels des suppléments pizza avant de les ajouter.
- [ ] Confirmer auprès du restaurant les allergènes et disponibilités avant publication.
- [x] Garder les catégories de fulfillment fiables côté serveur ; salades, viande, boissons et desserts restent `OTHER`. La règle concernant les desserts reste inchangée.

Les règles de livraison et retrait restent inchangées. Aucune commande réelle ni aucun paiement n'est activé.

## Prochain jalon — couverture d’adresse et disponibilité

L’interface de zones actuelle est un aperçu : choisir une zone ne prouve pas qu’une adresse est desservie. Avant toute validation d’adresse, le restaurant doit approuver une source de couverture et des frontières précises. Ne pas déduire ces frontières depuis les noms de zones ou les saisies du client.

- [ ] Valider la source de couverture et les frontières d’adresse avec le restaurant, puis appliquer la vérification côté serveur.
- [ ] Définir les horaires, créneaux, capacités et précommandes avec le restaurant.
- [ ] Concevoir la création et le suivi des commandes avec autorisation serveur et processus de cuisine.
- [ ] Étudier les paiements et remboursements après validation juridique, contractuelle et opérationnelle.
- [ ] Préparer le pilote, la surveillance et les sauvegardes avant toute mise en production.

Ces jalons demandent des validations commerciales et opérationnelles. Tant qu’elles ne sont pas acquises, l’application reste en prévisualisation : aucun checkout, commande réelle ou paiement ne doit être activé. Ne pas modifier la règle des desserts sans confirmation.

À chaque PR : ajouter les tests appropriés, exécuter le typecheck et le build, et mettre à jour le README, le changelog et la documentation fonctionnelle concernée.
