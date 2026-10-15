# Changelog

## 2026-10-15

- File professionnelle des essais paginée et filtrable, priorité aux plus anciens essais à traiter, avec actualisation de la liste.

- Historique client paginé et recherche par référence/statut, avec accès aux anciens essais au-delà des 50 derniers.

- Carnet d’adresses client privé, adresse par défaut et préremplissage des livraisons simulées, avec contrôle des modifications concurrentes.

- Reprise d’un essai depuis l’historique client avec vérification des options et tarifs actuels, puis ajout confirmé au panier existant.

- vérification e-mail, récupération du mot de passe et Mailpit local, avec liens à usage unique, expiration et révocation des accès précédents.

- coordonnées du profil client et changement de mot de passe avec rotation et révocation des sessions, y compris face aux connexions concurrentes.

- espace client protégé, inscription/connexion locale, commandes de test séparées, historique, confirmation et suivi professionnel simulé.

- modification des recettes depuis le panier, validation serveur, fusion des recettes identiques et tests Chromium.
- PR #20 fusionnée : personnalisation interactive et espace gérant avec création de pizzas en brouillon.

- Personnalisation interactive : retraits sans remise, suppléments par format, recettes conservées dans le panier et contrôle serveur.
- Création de pizzas en brouillon (33 cm et 50 cm facultatif), publication explicite et recherche des articles.
- Éditeur de carte gérant protégé, vérification des identifiants et révisions contre les conflits.
- Connexion gérant par lien privé à usage unique généré depuis le serveur, session sécurisée et déconnexion.
- Migrations préparées, sans exécution automatique ni données commerciales inventées.


## 2026-10-14

- PR #18 fusionnée : statut des horaires informatif étendu aux jours fériés légaux belges (service du soir 18h–22h, dimanche fermé). Les jours de remplacement et exceptions du restaurant restent à confirmer.
- PR #17 : statut informatif des horaires hebdomadaires calculé dans le fuseau Europe/Brussels, sans ouvrir le checkout.
- PR #15 fusionnée : seed explicite des 88 produits et prix du menu daté, choix de pâtes et de desserts tarifés côté serveur, supplément fromage exclusif. Les suppléments pizza non détaillés ne sont pas configurés.
- PR #14 fusionnée : transcription du menu photographié daté du 14/10/2026 dans la documentation.

- PR #12 : panier relié aux sélections du catalogue ; prix, sous-total et règles de livraison/retrait relus côté serveur.
- PR #11 : catalogue actif publié en lecture seule sur le menu.
- PR #10 : aperçu serveur du panier fondé sur les données Prisma et classification de fulfillment explicite.
- PR #9 : aperçu livraison/retrait connecté au panier.
- PR #1 à #8 : fondations du projet, règles de prix et de livraison, catalogue de présentation, personnalisation pizza et panier de démonstration.

Les PR #1 à #18 sont fusionnées. Aucune n'active la prise de commandes réelles ou les paiements. Le seed commercial doit être lancé explicitement sur la base souhaitée ; les allergènes, les suppléments pizza détaillés et les frontières de livraison restent à valider. La règle concernant les desserts reste inchangée.
