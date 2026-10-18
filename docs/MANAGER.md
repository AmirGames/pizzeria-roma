# Espace gérant

## Fonctionnement

`/gerant/accueil` permet à un compte MANAGER de modifier le titre, les textes, les libellés des boutons, l’image du bandeau, la section histoire et les métadonnées SEO de l’accueil. Une liste d’images déjà installées évite de saisir un chemin de fichier. Les textes sont validés côté serveur, et une révision empêche d’écraser silencieusement les changements d’un autre gérant. Le bouton « Enregistrer et publier » applique les changements immédiatement. La migration `20261023100000_homepage_content` doit être appliquée à la base cible avec `npx prisma migrate deploy`.

Le tableau `/gerant` reste accessible au MANAGER même si les modes test et commandes réelles sont désactivés. Il présente alors les réglages de préparation (base/carte, migration de l’éditeur d’accueil, zones, Stripe/webhook, ouverture des commandes, e-mails) sans afficher de secret et propose les raccourcis d’administration.

`/gerant/carte` permet à un gérant connecté de modifier le nom français, la disponibilité et les prix des articles existants. Pour les pizzas : ingrédients retirables et suppléments avec prix fixe ou par format. Un tarif de format laissé vide signifie que le supplément n'est pas proposé dans ce format. Les prix nuls sont autorisés explicitement ; aucun tarif n'est inventé par le système.

Les formats existants sont conservés, avec prix et disponibilité modifiables. Un formulaire permet de créer une pizza en brouillon dans une catégorie PIZZA existante : prix 33 cm obligatoire, format 50 cm facultatif et ingrédients retirables. Le brouillon reste invisible aux clients jusqu’à son activation explicite dans l’éditeur. Le nom anglais est initialement identique au nom français. La création de catégories, les autres types de produits, l’ajout de formats à un article existant, la traduction anglaise et les allergènes ne font pas partie de cet écran. Une recherche par nom ou catégorie facilite la sélection des articles. Retirer un supplément du formulaire le désactive en base ; il reste visible comme indisponible après rechargement. Au maximum 20 suppléments sont soumis dans une modification.

Les changements enregistrés sont immédiatement publiés dans la base cible. Une révision empêche l'écrasement silencieux des changements d'un autre gérant (HTTP 409). Les articles déjà au panier sont recalculés selon le catalogue courant. Un ingrédient retiré de la configuration peut rendre un ancien panier invalide ; le client peut supprimer l'article concerné et le recomposer.

## Installation et accès

1. Installer les dépendances, appliquer les migrations sur la base cible et régénérer Prisma : `npm install`, `npx prisma migrate deploy`, `npm run db:generate`.
2. Configurer `DATABASE_URL` sur le serveur. Derrière un proxy, renseigner `APP_ORIGIN` avec l'origine publique exacte, par exemple `https://pizza.example` (sans chemin).
3. Depuis un terminal de confiance sur ce serveur, générer un accès : `npm run manager:access -- --email gerant@example.be --origin https://pizza.example`.
4. Ouvrir le lien privé généré puis confirmer la connexion. Il expire après 15 minutes et ne peut servir qu'une fois. Un nouveau lien invalide les liens précédents du compte. La session expire après 7 jours ; « Se déconnecter » la supprime en base.

Le script crée un compte MANAGER s'il n'existe pas. Il refuse un compte existant CUSTOMER/KITCHEN ou désactivé : il ne promeut jamais automatiquement un compte existant. Il ne tourne ni au build ni au seed. L'adresse saisie désigne le compte provisionné par l'opérateur, elle n'est pas vérifiée par e-mail et aucun message n'est envoyé.

Le lien est un secret temporaire : ne pas le publier dans GitHub ou dans des journaux partagés. Son jeton se trouve dans le fragment de l'URL (absent des requêtes HTTP) puis est retiré de l'historique par le formulaire. Seul son hash SHA-256 est enregistré. Une transaction consomme le lien avant de créer la session ; deux utilisations simultanées ne peuvent pas créer deux sessions. Les cookies sont HttpOnly, SameSite=Lax, Secure en production ; HTTP n'est permis qu'en développement local.

## Autorisations et limites

L'écran et l'API vérifient `catalog:write` à partir du rôle relu en base. Les mutations exigent une origine identique et du JSON ; le navigateur ne fournit jamais le rôle. Chaque identifiant d'option doit appartenir au produit modifié. Une erreur de base ne contourne pas les contrôles d'accès.

Cet accès par terminal permet d'utiliser l'éditeur sans service d'e-mail ni mot de passe partagé. La gestion des invitations depuis l'interface, le MFA, l'audit détaillé des modifications et les exigences d’exploitation avant ouverture publique restent à préparer. L’espace client de test est décrit dans [CUSTOMER_TESTS.md](CUSTOMER_TESTS.md). Aucune commande réelle ni paiement n'est activé.

Le seed du menu est un import explicite : le relancer réapplique les noms, prix et disponibilités du menu source et remplace les options qui lui appartiennent. Ne pas le relancer sur une carte modifiée sans vouloir restaurer ces données. Les ingrédients retirables et les suppléments créés par le gérant sont préservés.

## Vérifications

`npm test` couvre les règles de prix, les retraits, la validation des modifications, l'origine des requêtes et les jetons à usage unique. La CI crée PostgreSQL 16 dans une base jetable `roma_test`, applique toutes les migrations, valide Prisma, vérifie TypeScript, compile Next.js puis lance `npm run test:integration`. Ce test utilise les vraies routes et contrôle la connexion, le refus des accès anonymes et des origines étrangères, les mises à jour concurrentes, les options publiées, les devis par format, le changement de rôle et la déconnexion. Il ne s'exécute qu'avec `RUN_DATABASE_TESTS=1` et une base dont le nom finit par `_test`.

Le test d’intégration couvre aussi la création protégée d’un brouillon, le refus d’une catégorie étrangère au type PIZZA et sa publication explicite.

## File gérant/cuisine des essais

Avec `ENABLE_TEST_ORDERS=true`, `/gerant/commandes-test` exige `orders:read` (MANAGER/KITCHEN). Les mutations de statut exigent toujours `orders:update-status`, une origine JSON identique et la révision courante. Les sessions désactivées ou révoquées perdent l’accès. Le catalogue reste réservé à MANAGER ; les filtres de cette file ne modifient aucun rôle.

La vue par défaut affiche les statuts PENDING, ACCEPTED, PREPARING, READY et OUT_FOR_DELIVERY, dans l’ordre `placedAt ASC, id ASC`. « Tous les statuts » inclut aussi les essais terminés, refusés et annulés. La recherche par référence est insensible à la casse et combinable avec le statut et le mode. Le tri inverse est disponible. Chaque page contient au maximum 20 essais, sans limite globale à 100. Les paramètres sont validés ; un filtre invalide rétablit la file à traiter par défaut avec un message. Une page trop grande est ramenée à la dernière disponible.

Le compte des résultats et les articles sont lus dans une transaction PostgreSQL cohérente. La page est dynamique et réservée aux professionnels, sans cache partagé. La pagination peut évoluer si d’autres sessions ajoutent des essais ou changent leur statut entre deux lectures. « Actualiser la liste » conserve les filtres ; les boutons par essai gardent le contrôle de révision. Un conflit demande une actualisation avant une nouvelle décision.

Les tests utilisent 126 essais pour vérifier pagination, dates identiques, tri, filtres, droits gérant/cuisine, refus client/anonyme, compte désactivé et mode désactivé. Chromium couvre pagination, acceptation depuis une liste filtrée, conflit avec une autre session, actualisation, recherche et remise à zéro. Aucun essai ne doit déclencher de préparation réelle.

## Tableau de bord des essais

`/gerant` exige le mode test et la permission `reports:read` (MANAGER). La cuisine conserve `orders:read` et sa file, mais ne reçoit pas cette permission de rapport. Les sessions sont relues côté serveur ; une révocation, désactivation ou perte du rôle coupe l’accès. La page est dynamique et sans cache partagé. Les liens apparaissent dans la gestion de carte et, pour le gérant, dans la file.

Les compteurs actifs portent sur toutes les dates et reprennent les mêmes statuts que la file « À traiter ». Chaque compteur ouvre un filtre de la liste existante. Le résumé du jour concerne les essais dont `placedAt` est supérieur ou égal au minuit local et strictement inférieur au minuit suivant, en `Europe/Brussels`. Les deux minuits sont convertis séparément en UTC pour gérer les changements d’heure. Un essai ancien encore actif figure dans la file, mais pas dans le résumé du jour.

Le total quotidien comprend tous les statuts, distingue livraison/retrait et compte les essais actuellement CANCELLED/REJECTED. Il ne mesure pas les actions effectuées aujourd’hui ni un revenu. Les agrégats sont lus dans une transaction cohérente et aucune coordonnée client ni détail d’article n’est chargé par cette page. L’heure de lecture est affichée, avec une actualisation manuelle. Aucun changement de statut n’est effectué par le tableau lui-même.

Les tests couvrent hiver, été, journées de 23/25 heures et changement d’année ; permissions, mode désactivé et absence de données personnelles ; exactitude des bornes quotidiennes, navigation vers les filtres, mise à jour depuis la file et actualisation du résumé. Aucune migration supplémentaire.
## Commandes Stripe

La file des commandes réelles propose le remboursement Stripe et l’avoir complet uniquement aux MANAGER. L’avoir remplace le remboursement et requiert la confirmation du gérant que le client propriétaire a accepté ; l’horodatage et l’identifiant gérant sont conservés au journal. Cette option n’est disponible que pour les commandes reliées à un compte client. Le suivi `/gerant/remboursements` est réservé aux MANAGER.

Les remboursements Stripe avec confirmation immédiate annulent la commande ; les remboursements en attente passent à REFUND_REQUIRED et sont retirés de la file cuisine. `charge.refunded` confirme le remboursement et restitue le crédit précédemment utilisé ; `refund.failed` replace le paiement à traiter dans la file cuisine. L’identifiant idempotent inclut la révision de commande afin de permettre une nouvelle tentative après échec.
