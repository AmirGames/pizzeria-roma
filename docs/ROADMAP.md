# Roadmap GitHub

## État des pull requests

Les PR GitHub **#1 à #18 sont fusionnées**. Les jalons produit ci-dessous décrivent le travail restant et ne reprennent pas nécessairement la numérotation des PR.

- [x] PR #1–#8 : fondations, catalogue, personnalisation, panier de démonstration et règles de livraison/retrait.
- [x] PR #9 : connecter le panier de démonstration aux règles de livraison et de retrait.
- [x] PR #10 : aperçu serveur des sélections depuis le catalogue Prisma.
- [x] PR #11 : publier en lecture seule le catalogue actif.
- [x] PR #12 : ajouter les sélections du catalogue au panier et recalculer côté serveur les prix et règles.
- [x] PR #13 : aligner la roadmap et les règles commerciales.
- [x] PR #14 : transcrire le menu daté du 14/10/2026.
- [x] PR #15 : charger explicitement les 88 produits, tarifs et choix confirmés du menu 2026 dans le catalogue.
- [x] PR #16 : synchroniser la documentation du projet.
- [x] PR #17 : afficher l’état informatif des horaires hebdomadaires.
- [x] PR #18 : appliquer 18h–22h aux jours fériés légaux belges, dimanche fermé.

## Catalogue du menu actuel — PR #15 fusionnée

La carte est transcrite dans [RESTAURANT_MENU_SOURCE.md](RESTAURANT_MENU_SOURCE.md) et les données structurées dans `prisma/menu-2026-10-14.mjs`. Après migration, le seed doit être lancé explicitement sur la base voulue ; aucune étape de build ou de déploiement ne le lance automatiquement. La fusion de la PR ne prouve pas que la base d’un environnement particulier a été amorcée.

- [x] Représenter côté serveur les choix de pâtes, les tarifs tagliatelle, les choix de desserts et le supplément fromage exclusif.
- [ ] Obtenir du restaurant la liste et les prix individuels des suppléments pizza avant de les ajouter.
- [ ] Confirmer auprès du restaurant les allergènes et disponibilités avant publication.
- [x] Garder les catégories de fulfillment fiables côté serveur ; salades, viande, boissons et desserts restent `OTHER`. La règle concernant les desserts reste inchangée.

Les règles de livraison et retrait restent inchangées. Aucune commande réelle ni aucun paiement n'est activé.

## Horaires hebdomadaires — aperçu

La page `/commande` affiche un statut informatif calculé dans le fuseau `Europe/Brussels` à partir des horaires habituels. Selon le menu du 14/10/2026, les jours fériés légaux belges ont un horaire 18h–22h ; le dimanche reste fermé. Les jours de remplacement et exceptions spécifiques doivent être confirmés avec le restaurant. L’indicateur ne conditionne pas le checkout.

## Couverture d’adresse et disponibilité en mode test

- [x] Le client saisit son adresse sans placer de repère ; ICAR (Géoportail de Wallonie) fournit une position, éventuellement approximative sur la rue, et le serveur calcule la zone depuis les frontières dessinées par le gérant.
- [x] Le gérant peut dessiner les frontières des zones sur `/gerant/livraison`.
- [x] Créneaux de 15 minutes pendant les heures d’ouverture, jusqu’à 7 jours à l’avance ; capacité initiale de 7 pizzas par créneau et délai de retrait initial de 30 minutes modifiables par pas de 15 minutes.
- [ ] Confirmer les frontières concrètes, horaires d’exception et valeurs opérationnelles avant une éventuelle ouverture commerciale.
- [ ] Concevoir la création et le suivi des commandes avec autorisation serveur et processus de cuisine.
- [ ] Étudier les paiements et remboursements après validation juridique, contractuelle et opérationnelle.
- [ ] Préparer le pilote, la surveillance et les sauvegardes avant toute mise en production.

Les fonctions d’adresse et de créneaux ne s’appliquent qu’aux essais. Tant que les validations commerciales et opérationnelles ne sont pas acquises, aucun checkout commercial, commande réelle ou paiement ne doit être activé. Ne pas modifier la règle des desserts sans confirmation.

À chaque PR : ajouter les tests appropriés, exécuter le typecheck et le build, et mettre à jour le README, le changelog et la documentation fonctionnelle concernée.

## Proposition du 15/10/2026

Personnalisation interactive et espace gérant avec accès privé : voir [MANAGER.md](MANAGER.md) et [PIZZA_CUSTOMIZATION.md](PIZZA_CUSTOMIZATION.md). Ces changements ont été fusionnés dans la PR #20 ; aucun déploiement n’est effectué. Les compositions et tarifs des suppléments restent à fournir ; les migrations doivent être appliquées explicitement.

## Proposition suivante — édition du panier

Modification du format, des suppléments et des retraits directement depuis le panier, avec validation serveur et conservation des quantités. Les recettes identiques sont regroupées ; un changement externe du panier bloque une édition devenue obsolète. Tests du parcours dans Chromium.

## Proposition — espace client et commandes locales

Comptes clients et workflow de test explicites : inscription/connexion, coordonnées fictives, confirmation, historique et statut simulé gérant/cuisine. La prise de commandes commerciales, les paiements et la validation réelle des adresses restent désactivés. Voir [CUSTOMER_TESTS.md](CUSTOMER_TESTS.md).
