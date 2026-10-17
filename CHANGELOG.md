# Changelog

## 2026-10-18

- Le détail client d’une commande réelle suit automatiquement les changements d’état pendant cinq minutes, puis propose un bouton d’actualisation manuelle.
- Après un paiement confirmé par Stripe, la page client revérifie automatiquement la synchronisation avec le webhook pendant 45 secondes et propose ensuite une vérification manuelle.
- La file cuisine rappelle les réglages d’impression recommandés pour les tickets 80 mm : format du rouleau, échelle 100 % et en-têtes/pieds de page désactivés.
- La file cuisine des commandes payées s’actualise automatiquement toutes les 20 secondes lorsque l’onglet est visible ; l’actualisation manuelle reste accessible.
- La confirmation de commande n’affiche plus l’adresse de livraison complète ; l’identifiant Stripe présent dans l’URL n’est pas transmis comme référent.
- La carte publique est mise en cache côté serveur pour éviter de relire tout le catalogue à chaque visite ; toute modification de produits, catégories ou ingrédients depuis l’espace gérant invalide ce cache immédiatement.
- Le détail des commandes réelles dans l’espace client présente les articles offerts et sépare fidélité, promotions, avoir et paiement.
- L’export JSON du client est disponible en mode commandes réelles et contient les montants de remise, fidélité, avoir et les articles commandés.
- Suppression de compte protégée par le mot de passe : profil, adresses, sessions et commandes de test supprimés ; les commandes réelles terminées sont dissociées et leurs coordonnées effacées. La suppression est bloquée pour une commande ou un avoir encore actif.
- Correction d’un verrou d’activation : connexion, création de compte, profil, mot de passe et carnet d’adresses clients fonctionnent aussi lorsque seules les commandes réelles sont activées ; les e-mails locaux restent réservés au mode test.
- Le webhook Stripe ne traite une erreur d’unicité comme un doublon que si l’identifiant de l’événement est réellement enregistré ; sinon Stripe reçoit une erreur et peut réessayer.
- Le checkout réel connecté propose les adresses du carnet client et présélectionne l’adresse par défaut ; chaque adresse choisie est revalidée contre les zones de livraison avant d’autoriser la commande.
- Vérification, récupération et changement d’adresse e-mail utilisent Mailpit en mode test et Resend configurable en mode commandes réelles ; les pages et actions de confirmation sont ouvertes dans les deux modes.

## 2026-10-17

- Ajout d’une PWA installable, avec manifeste, icônes et page de secours affichée lors d’une coupure réseau ; aucune donnée ni commande n’est stockée hors ligne.
- Le tableau de bord gérant affiche maintenant les compteurs des commandes réelles payées et les recettes du jour, séparément des essais ; la navigation masque les files désactivées.
- La page Livraison indique l’état réel du checkout et de Stripe au lieu d’afficher systématiquement le mode test.
- Les offres existantes de l’administration des promotions sont sélectionnées dans une liste et les conditions avancées sont repliées par défaut.
- Ajout d’une remise automatique réservée à la première commande d’un client connecté ; son montant est recalculé côté serveur et enregistré avec la commande réelle.
- Ajout d’un endpoint `/api/health` qui confirme uniquement l’état de disponibilité de PostgreSQL, sans exposer de configuration.
- Ajout des avoirs clients : journal de crédits, accord client attesté pour l’octroi par le gérant, utilisation complète ou partielle au checkout connecté, réservation pendant Stripe puis consommation/restauration selon le résultat du paiement.
- Ajout d’une page gérant réservée aux MANAGER pour suivre les remboursements Stripe en attente, avec l’accès depuis la file des commandes.
- Ajout côté gérant d’une action de remboursement complet via Stripe avec confirmation, idempotence et synchronisation par webhook ; le remboursement est réservé aux rôles autorisés et annule la commande une fois confirmé.
- Ajout de l’historique des commandes réelles dans l’espace client et d’une page de détail protégée par le compte propriétaire, avec suivi, état du paiement, créneau et articles.
- Le compte distingue maintenant les achats réels des essais de commande, selon les fonctionnalités activées.

## 2026-10-15

- Ajout en mode test du dessin des zones, de la vérification ICAR avec adresse approximative acceptée, des créneaux de 15 minutes et du réglage de capacité/délai minimum de retrait et livraison. Aucun traitement réel n’est activé.

- Tableau de bord gérant des essais : compteurs actifs, liens filtrés et résumé quotidien dans le fuseau de Bruxelles.

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
