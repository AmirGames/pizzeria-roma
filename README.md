# Pizzeria Roma

Application Next.js / TypeScript pour Pizzeria Roma à Namur, avec PostgreSQL et Prisma.

## État du projet

Les étapes récentes couvrent l’édition du panier ([#21](https://github.com/AmirGames/pizzeria-roma/pull/21)), l’espace client ([#22](https://github.com/AmirGames/pizzeria-roma/pull/22)), le profil et le mot de passe ([#23](https://github.com/AmirGames/pizzeria-roma/pull/23)), les e-mails locaux ([#25](https://github.com/AmirGames/pizzeria-roma/pull/25)), les adresses ([#26](https://github.com/AmirGames/pizzeria-roma/pull/26)) et la reprise depuis l’historique ([#27](https://github.com/AmirGames/pizzeria-roma/pull/27)).

Le projet peut être essayé en local. **Les commandes commerciales et les paiements restent désactivés.** Les essais sont enregistrés dans `TestOrder`, séparément de `Order` ; aucun e-mail externe, ordre de préparation réelle ou réservation de créneau n’est envoyé. La fusion du code n’applique aucune migration à votre base et ne déploie pas le site.

## Fonctionnalités disponibles

- Catalogue du menu du 14/10/2026, avec les compositions de pizzas et les compositions explicitement décrites pour les pâtes relevées depuis les photos du menu, ainsi que les formats, choix de pâtes, desserts et suppléments configurés.
- Personnalisation d’une pizza prédéfinie : retrait d’ingrédients autorisés **sans réduction du prix**, et suppléments à prix fixe ou selon le format.
- Panier catalogue : modification des recettes, conservation des quantités et regroupement des recettes identiques, avec contrôle serveur des prix et options.
- Espace gérant : création et classement des catégories, création de plats avec formats et prix, gestion de leur composition, des ingrédients retirables, des suppléments et des disponibilités. Les nouveaux plats restent en brouillon jusqu’à publication explicite.
- Promotions gérant : remises automatiques et codes promo en pourcentage ou montant fixe, avec période, jours, heures de validité, minimum de panier et plafond d’utilisations. Les remises sont calculées côté serveur et enregistrées sur les essais.
- Carte de fidélité client : une pizza ou des pâtes terminées ajoutent un crédit ; après 10 plats payés, le plat éligible le moins cher est offert. Les annulations et refus ne donnent aucun crédit.
- En mode test : inscription/connexion client, profil nom/téléphone, changement de mot de passe, confirmation, historique privé et annulation des essais en attente.
- Carnet privé de dix adresses en mode test : ajout, modification, suppression, adresse par défaut et sélection au checkout.
- Export JSON des données du compte connecté : profil, adresses et historiques de commandes associés, sans identifiants ni secrets.

- Historique client paginé : recherche par référence, filtre par statut et accès aux anciens essais au-delà des 50 derniers.
- Reprise d’une ancienne sélection depuis l’historique, avec prix actuels et ajout confirmé au panier existant.
- Tableau de bord gérant : compteurs des essais actifs, liens vers les files et résumé du jour en heure de Bruxelles.
- File gérant/cuisine paginée : essais à traiter par ancienneté, recherche par référence, filtres par statut et livraison/retrait, transitions de statut et contrôle des permissions.
- Aperçu des zones et minima de livraison, du retrait et des horaires dans le fuseau `Europe/Brussels`.
- En mode test : vérification des adresses avec ICAR (Géoportail de Wallonie), zone déduite des frontières dessinées par le gérant et conservation de l’adresse complète pour le livreur.
- En mode test : créneaux de 15 minutes pendant les heures d’ouverture jusqu’à 7 jours à l’avance, capacité initiale de 7 pizzas et délai minimum initial de 30 minutes pour le retrait et la livraison réglables par le gérant.

Les compositions des pizzas, les tarifs individuels des suppléments pizza et les allergènes restent à confirmer/renseigner. Ils ne sont pas déduits des noms des produits ni inventés par le seed.

## Démarrer en local

Prérequis : **Node.js 22**, npm, Git et Docker avec Docker Compose. Démarrer Docker avant les commandes de base de données.

### 1. Récupérer le projet

```bash
git clone https://github.com/AmirGames/pizzeria-roma.git
cd pizzeria-roma
```

### 2. Configurer `.env`

Créer un fichier `.env` à la racine. Exemple réservé au développement local :

```env
POSTGRES_PASSWORD=roma_local_dev
DATABASE_URL=postgresql://roma:roma_local_dev@localhost:5432/roma?schema=public
APP_ORIGIN=http://localhost:3000
ENABLE_TEST_ORDERS=true
LOCAL_MAIL_URL=http://127.0.0.1:8025
```

Le mot de passe PostgreSQL doit correspondre dans les deux premières lignes. Ne jamais committer `.env` ni des identifiants réels. Voir [`.env.example`](.env.example).

Si le port local `5432` est déjà utilisé ou réservé, définir aussi `POSTGRES_PORT=5433` dans `.env` et remplacer `localhost:5432` par `localhost:5433` dans `DATABASE_URL`. Le port du conteneur reste `5432`.

`ENABLE_TEST_ORDERS=true` active explicitement les comptes clients et les commandes simulées. Sans cette valeur, le mode est désactivé. Utiliser des coordonnées fictives pour les essais.

### 3. Installer et préparer la base locale

```bash
npm install
npm run db:generate
docker compose up -d db mailpit
npx prisma migrate deploy
```

Mailpit capture les e-mails de vérification et de récupération sur [http://localhost:8025](http://localhost:8025). Aucun serveur SMTP externe n’est utilisé.

Le conteneur PostgreSQL conserve les données dans un volume Docker et expose son port uniquement sur `127.0.0.1:5432`. Attendre que la base soit prête si la première migration rencontre une erreur de connexion.

### 4. Charger la carte initiale, une seule fois si nécessaire

```bash
npm run db:seed
```

Le seed charge explicitement la carte dans la base pointée par `DATABASE_URL`. Il n’est exécuté ni au build ni automatiquement au démarrage. **Le relancer réapplique les noms, prix, compositions, disponibilités et options du menu source** : ne pas le relancer après personnalisation sans vouloir restaurer ces données.

### 5. Démarrer le site

```bash
npm run dev
```

Ouvrir [http://localhost:3000/menu](http://localhost:3000/menu).

## Mettre à jour une installation locale existante

Depuis le dépôt, après avoir sauvegardé ou committé vos modifications locales :

```bash
git switch main
git pull --ff-only origin main
npm install
npm run db:generate
docker compose up -d db mailpit
npx prisma migrate deploy
npm run dev
```

Arrêter l’ancien serveur de développement avant de le relancer. Conserver votre `.env` et ajouter `ENABLE_TEST_ORDERS=true` pour essayer l’espace client, ainsi que `LOCAL_MAIL_URL=http://127.0.0.1:8025` pour la boîte mail locale. **Aucun nouveau seed n’est nécessaire pour ces mises à jour.** Vérifier que `DATABASE_URL` désigne bien la base locale souhaitée avant toute migration.

## Accès gérant

Depuis un deuxième terminal dans le dossier du projet, remplacer l’adresse d’exemple par celle du compte gérant souhaité :

```bash
npm run manager:access -- --email gerant@example.be --origin http://localhost:3000
```

Ouvrir le lien privé affiché puis confirmer la connexion. Le lien expire après 15 minutes et ne sert qu’une fois. Le script crée un compte `MANAGER` s’il n’existe pas ; il refuse de promouvoir automatiquement un compte client existant. Aucun compte gérant n’est créé au seed ou au déploiement, et aucun e-mail n’est envoyé.

Garder ce lien privé. Utiliser des comptes distincts pour les parcours client et professionnel. Voir [le guide gérant](docs/MANAGER.md).

## Pages principales

| Page | Utilisation |
| --- | --- |
| `/menu` | Carte et personnalisation avant ajout au panier |
| `/panier` | Sélection catalogue et modification des recettes ; démonstration fictive séparée si aucun article catalogue |
| `/commande` | Aperçu livraison/retrait, zones et horaires |
<<<<<<< Updated upstream
| `/compte` | Inscription, connexion, profil, carte de fidélité et historique client en mode test |
=======
| `/compte` | Inscription, connexion, profil, adresses, export des données et historique client en mode test |
| `/api/customer/export` | Téléchargement privé des données du client connecté |
>>>>>>> Stashed changes
| `/compte/mot-de-passe-oublie` | Demande d’un lien de récupération dans Mailpit |
| `/compte/verifier` et `/compte/reinitialiser` | Confirmation des liens à usage unique reçus localement |
| `/commande/test` | Confirmation d’un essai pour un client connecté |
| `/compte/commandes/[id]` | Détail et suivi d’un essai appartenant au client |
| `/gerant/connexion` | Connexion par lien privé |
| `/gerant` | Tableau de bord des essais, réservé au gérant |
| `/gerant/carte` | Édition de la carte, réservée au gérant |
| `/gerant/promotions` | Création et activation des promotions et codes promo, réservée au gérant |
| `/gerant/commandes-test` | Suivi simulé, réservé au gérant et à la cuisine |
| `/gerant/livraison` | Réglage des créneaux et dessin des zones, réservé au gérant |

## Parcours de test conseillé

1. Avec le compte gérant, renseigner les ingrédients retirables et les suppléments/prix d’une pizza.
2. Avec un compte client distinct créé sur `/compte`, composer une pizza et l’ajouter au panier.
3. Modifier sa recette depuis `/panier`, puis confirmer un essai sur `/commande/test`.
4. Consulter son détail et son historique dans l’espace client.
5. Avec le compte professionnel, simuler les étapes de préparation jusqu’à « Test terminé » dans `/gerant/commandes-test`, puis vérifier les crédits de fidélité dans l’espace client.

Le changement de mot de passe demande le mot de passe actuel et une confirmation. Il crée une nouvelle session pour le navigateur courant et déconnecte les autres sessions, y compris face à une connexion concurrente. Les coordonnées modifiées préremplissent les prochains essais et ne réécrivent pas l’historique.

## Livraison, retrait et limites actuelles

La livraison est gratuite. Seules les pizzas et les pâtes comptent pour le minimum : Namur centre = 1 plat ; Belgrade, Erpent et Saint-Servais = 2 plats. Une pizza 50 cm compte pour 2 ; une pizza 33 cm compte pour 2 à partir de 18 € par pizza, suppléments inclus ; les pâtes comptent pour 1. Salades, boissons et desserts sont exclus. Le retrait n’a pas de minimum de plats.

En mode test, le client saisit son adresse sans placer de repère. ICAR renvoie une position de maison, y compris estimée sur la rue si le numéro exact est introuvable ; le serveur détermine la zone depuis les frontières enregistrées par le gérant. L’adresse complète saisie est conservée pour le livreur. Le gérant doit dessiner les zones sur `/gerant/livraison` avant d’essayer une livraison.

Les créneaux simulés durent 15 minutes et sont proposés pendant les horaires d’ouverture, jusqu’à 7 jours à l’avance. La configuration initiale limite chaque créneau à 7 pizzas ; le délai minimum initial est de 30 minutes pour le retrait et la livraison. Le gérant peut modifier ces valeurs, par pas de 15 minutes pour le délai. Les jours fériés légaux belges affichent un service informatif 18h–22h, sauf dimanche fermé.

<<<<<<< Updated upstream
## Promotions et codes promo

Dans `/gerant/promotions`, un compte MANAGER peut créer une remise automatique ou un code à saisir au checkout. La remise peut être un pourcentage entier ou un montant fixe en euros. Chaque offre peut avoir une date de début et de fin inclusives, un ou plusieurs jours de la semaine, une plage horaire, un minimum de panier et un nombre maximum d’utilisations. Sans période de dates, l’offre n’a pas de borne de date ; sans plage horaire, elle est valable toute la journée. Les horaires et jours sont évalués en `Europe/Brussels` ; l’heure de fin est exclue (par exemple 12h00–13h00 s’arrête à 13h00).

Une seule promotion automatique peut être active à la fois. Si un code saisi et une promotion automatique sont tous deux applicables, une seule remise est appliquée : la plus avantageuse. Les prix et la remise sont recalculés côté serveur à l’aperçu et à l’enregistrement. Le plafond d’utilisations est réservé de façon atomique avec l’essai ; le code, le montant de la remise et le total sont conservés sur `TestOrder`.

Les promotions, la fidélité et le catalogue central d’ingrédients nécessitent la migration `20261016100000_promotions`, à appliquer avec `npx prisma migrate deploy`, puis la génération du client Prisma avec `npm run db:generate`. Pour charger la liste initiale d’ingrédients avec le menu, lancer `npm run db:seed` après la migration. Les promotions s’appliquent actuellement aux commandes de test uniquement : les commandes commerciales et les paiements restent désactivés.

## Carte de fidélité

La carte est visible dans `/compte` pour le client connecté. Les pizzas et pâtes d’un essai sont créditées uniquement lorsque son statut devient terminé. À chaque groupe de 10 plats payés, le client obtient un plat éligible offert ; si plusieurs plats sont dans le panier, le moins cher est déduit. Le crédit peut être réservé au checkout, mais il n’est consommé qu’à la fin de l’essai : un essai annulé ou refusé libère le crédit. Une remise de fidélité peut s’ajouter à une promotion ou un code promo ; l’offre promotionnelle est calculée sur le sous-total restant après le plat offert.

La fidélité utilise les commandes de test car les ventes réelles sont désactivées. Le nombre de pizzas et pâtes des essais déjà enregistrés est repris par la migration `20261016100000_promotions`. Cette migration ajoute aussi le champ de composition des plats. Aucun seed supplémentaire n’est requis.

## Gestion des catégories et des plats

Dans `/gerant/carte`, le gérant peut ajouter ou renommer une catégorie, définir son type (pizzas, pâtes ou autres plats) et son ordre d’affichage. Le catalogue central « Ingrédients & suppléments » gère chaque ingrédient une seule fois, son activation comme supplément et ses tarifs 33/50 cm (1,50 €/3,00 € par défaut, modifiables). Les ingrédients actifs sont proposés sur toutes les pizzas. À la création d’une pizza, le gérant coche sa composition ; ces ingrédients sont affichés au client et peuvent être retirés. Le client peut aussi ajouter une portion d’un ingrédient déjà inclus, au tarif du format choisi. Renommer un ingrédient répercute le nouveau nom dans les compositions enregistrées. Les plats de pâtes gardent leur propre composition. Les plats existants peuvent changer de catégorie et leur prix, formats, suppléments spécifiques et disponibilité restent modifiables depuis cette page.

La vérification e-mail et la récupération du mot de passe sont disponibles avec Mailpit en local. Un service d’envoi externe, la suppression/export du compte et les exigences d’exploitation restent à préparer avant l’ouverture publique de l’espace client. La PWA, la traduction complète et les paiements sont des objectifs, pas des fonctions annoncées comme terminées.
=======
La vérification e-mail et la récupération du mot de passe sont disponibles avec Mailpit en local. L’export JSON des données du compte est disponible en mode test. Un service d’envoi externe, la suppression du compte et les exigences d’exploitation restent à préparer avant l’ouverture publique de l’espace client. La PWA, la traduction complète et les paiements sont des objectifs, pas des fonctions annoncées comme terminées.
>>>>>>> Stashed changes

## Vérifications

Après installation et génération du client Prisma :

```bash
npm run db:validate
npm run typecheck
npm test
npm run build
```

Les tests d’intégration (`npm run test:integration`) et navigateur (`npm run test:browser`) nécessitent un build, les migrations appliquées, `RUN_DATABASE_TESTS=1`, `ENABLE_TEST_ORDERS=true` et une base dédiée dont le nom finit par `_test`. Pour Chromium, installer au préalable le navigateur avec `npx playwright install chromium`. Ne pas utiliser une base contenant des données réelles.

La CI fournit PostgreSQL 16 dans une base jetable, valide/applique les migrations, vérifie TypeScript, lance les tests unitaires et d’intégration, compile Next.js puis teste onze parcours dans Chromium avec Mailpit. Les contrôles sont exécutés sur chaque PR, puis sur `main` après fusion.

## Documentation

- [Catalogue et prix](docs/CATALOG.md) · [source du menu](docs/RESTAURANT_MENU_SOURCE.md)
- [Personnalisation](docs/PIZZA_CUSTOMIZATION.md) · [panier](docs/CART.md)
- [Espace gérant](docs/MANAGER.md) · [espace client et essais](docs/CUSTOMER_TESTS.md)
- [Livraison et retrait](docs/FULFILLMENT.md) · [sécurité](docs/SECURITY.md)
- [Roadmap](docs/ROADMAP.md) · [changelog](CHANGELOG.md)

Développement par pull requests avec revue et vérifications. Ne jamais publier de secrets, de clés API ou de données réelles de clients dans le dépôt.

## E-mails locaux : vérification et mot de passe oublié

Avec Mailpit démarré et `LOCAL_MAIL_URL` configurée, une inscription tente d’envoyer un lien de vérification dans la boîte locale. Le compte reste utilisable si cet envoi échoue ; le lien peut être redemandé depuis `/compte`. Les essais locaux restent autorisés sans vérification de l’e-mail.

Ouvrir [Mailpit](http://localhost:8025) pour lire les messages : les liens de vérification durent 24 heures et ceux de récupération 15 minutes. Un nouveau lien remplace le précédent du même type. Leur ouverture ne consomme rien : confirmer dans le formulaire. Les jetons sont retirés de l’URL affichée et seuls leurs hash sont stockés en base.

Le mot de passe oublié donne une réponse générique, que le compte existe ou non. Après réinitialisation, se reconnecter avec le nouveau mot de passe ; toutes les anciennes sessions sont invalidées. Un changement de mot de passe depuis le profil invalide aussi les anciens liens de récupération. Aucune nouvelle session n’est créée automatiquement après un lien de récupération.

## Adresses enregistrées

Dans `/compte`, « Mes adresses » permet d’ajouter jusqu’à dix adresses fictives avec un libellé (domicile, travail…) et une zone. La première devient l’adresse par défaut. Il est possible de choisir une autre adresse par défaut, de modifier une adresse ou de confirmer sa suppression. Supprimer l’adresse par défaut sélectionne automatiquement la plus ancienne adresse restante.

En livraison simulée, `/commande/test` préremplit l’adresse par défaut. Le client saisit ou corrige son adresse ; ICAR (Géoportail de Wallonie) fournit une position, éventuellement approximative sur la rue, et le serveur déduit la zone des polygones dessinés par le gérant. Le client n’a pas à placer de repère. L’adresse complète est conservée sur l’essai pour le livreur. Une saisie ponctuelle ne modifie pas le carnet ; les adresses restent privées et leur modification ne réécrit pas l’historique. La vérification et le créneau sont simulés.

Cette évolution nécessite la migration `20261015120000_customer_addresses`, en suivant les commandes de mise à jour locale ci-dessus ; aucun seed supplémentaire. Deux modifications concurrentes ne s’écrasent pas : un conflit demande d’actualiser la liste.

## Commander à nouveau depuis l’historique

Depuis le détail d’un essai dans `/compte`, « Commander à nouveau » vérifie la sélection dans la carte actuelle. Un aperçu indique les articles, options et prix d’aujourd’hui, ainsi que l’ancien total s’il a changé. Confirmer avec « Ajouter ces articles au panier », puis vérifier le panier avant de créer un nouvel essai. Aucun paiement ni nouvelle commande n’est créé par cette action.

Le panier existant est conservé ; les recettes identiques sont regroupées sans dépasser 99 exemplaires par recette ni 30 lignes. Un échec de l’ajout laisse le panier intact. L’adresse, les coordonnées et le commentaire de l’ancien essai ne sont pas copiés. L’historique reste identique.

Un article, format, supplément ou retrait devenu indisponible bloque la reprise complète : refaire la sélection depuis la carte. Les nouveaux instantanés conservent l’identifiant du format ; pour les anciens, seule une correspondance unique et exacte avec un libellé de format actif est acceptée. Aucune migration ou nouveau seed n’est nécessaire pour cette fonctionnalité.

## Rechercher dans l’historique client

Dans `/compte`, « Mes commandes de test » affiche les essais du compte connecté, 20 par page, du plus récent au plus ancien. La recherche accepte une référence complète ou partielle (lettres, chiffres et tirets, sans distinction de casse), combinable avec un statut. Lancer une recherche revient à la première page ; les liens de pagination gardent les filtres. « Réinitialiser les filtres » réaffiche l’historique complet. Les filtres et la page figurent dans l’URL pour pouvoir revenir au même écran.

Tous les anciens essais sont accessibles, y compris au-delà des 50 derniers. Une page au-delà de la dernière affiche la dernière page disponible. Des paramètres invalides affichent un message et rétablissent les filtres par défaut. Aucun essai n’est modifié et une URL ne donne jamais accès à l’historique d’un autre compte. Aucune migration ni nouveau seed nécessaire.

## File des essais côté gérant et cuisine

En mode test, `/gerant/commandes-test` affiche par défaut les essais à traiter (enregistrés, acceptés, en préparation simulée, prêts ou en livraison simulée), du plus ancien au plus récent. La liste est paginée à 20 résultats ; les anciens essais restent accessibles au-delà de l’ancienne limite de 100.

Rechercher une référence, choisir un statut (y compris « Tous les statuts »), le mode livraison/retrait et l’ordre de tri : date d’enregistrement ou créneau prévu le plus proche. Les liens de pagination gardent ces filtres ; une nouvelle recherche revient à la première page. Le bouton « Actualiser la liste » relit les données sans changer les filtres. Après une transition, un essai qui ne correspond plus au filtre quitte la liste.

L’accès exige une session professionnelle MANAGER ou KITCHEN ; un client ou une URL ne peut pas s’attribuer ces droits. Les transitions et révisions existantes restent contrôlées côté serveur. Il s’agit uniquement de simulations : aucune préparation réelle ni livraison n’est déclenchée. Aucune migration ni nouveau seed.

## Tableau de bord gérant

En mode test, `/gerant` est réservé aux comptes MANAGER (`reports:read`). Les compteurs couvrent les essais actifs de toutes dates : à traiter, à accepter, acceptés, en préparation, prêts et en livraison simulée. Chaque carte ouvre la file professionnelle avec le filtre correspondant.

Le résumé quotidien compte les essais enregistrés entre deux minuits en `Europe/Brussels`, y compris les journées de 23 ou 25 heures. Il distingue retraits, livraisons et essais actuellement annulés/refusés. Il se fonde sur la date d’enregistrement et le statut courant, sans montant commercial. « Actualiser le tableau de bord » relit les compteurs. Le tableau est accessible depuis la gestion de la carte et la file pour le gérant ; la cuisine conserve sa file de suivi.

Aucune migration ni nouveau seed. Les essais restent des simulations locales sans préparation réelle, paiement ou hébergement.
