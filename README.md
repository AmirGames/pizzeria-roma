# Pizzeria Roma

Application Next.js / TypeScript pour Pizzeria Roma à Namur, avec PostgreSQL et Prisma.

## État du projet

Les PR [#21](https://github.com/AmirGames/pizzeria-roma/pull/21), [#22](https://github.com/AmirGames/pizzeria-roma/pull/22) et [#23](https://github.com/AmirGames/pizzeria-roma/pull/23) sont fusionnées dans `main`, dans cet ordre : édition du panier, espace client et commandes de test, puis coordonnées du profil et changement du mot de passe.

Le projet peut être essayé en local. **Les commandes commerciales et les paiements restent désactivés.** Les essais sont enregistrés dans `TestOrder`, séparément de `Order` ; aucun e-mail externe, ordre de préparation réelle ou réservation de créneau n’est envoyé. La fusion du code n’applique aucune migration à votre base et ne déploie pas le site.

## Fonctionnalités disponibles

- Catalogue du menu du 14/10/2026, avec formats, choix de pâtes, desserts et suppléments configurés.
- Personnalisation d’une pizza prédéfinie : retrait d’ingrédients autorisés **sans réduction du prix**, et suppléments à prix fixe ou selon le format.
- Panier catalogue : modification des recettes, conservation des quantités et regroupement des recettes identiques, avec contrôle serveur des prix et options.
- Espace gérant : recherche des articles, gestion des prix/disponibilités/options et création de pizzas en brouillon avant publication explicite.
- En mode test : inscription/connexion client, profil nom/téléphone, changement de mot de passe, confirmation, historique privé et annulation des essais en attente.
- Carnet privé de dix adresses en mode test : ajout, modification, suppression, adresse par défaut et sélection au checkout.
- Suivi simulé des commandes côté gérant/cuisine, avec transitions de statut et contrôle des permissions.
- Aperçu des zones et minima de livraison, du retrait et des horaires dans le fuseau `Europe/Brussels`.

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

Le seed charge explicitement la carte dans la base pointée par `DATABASE_URL`. Il n’est exécuté ni au build ni automatiquement au démarrage. **Le relancer réapplique des noms, prix et disponibilités du menu source et remplace les options qu’il gère** : ne pas le relancer après personnalisation sans vouloir restaurer ces données.

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
| `/compte` | Inscription, connexion, profil, statut e-mail et historique client en mode test |
| `/compte/mot-de-passe-oublie` | Demande d’un lien de récupération dans Mailpit |
| `/compte/verifier` et `/compte/reinitialiser` | Confirmation des liens à usage unique reçus localement |
| `/commande/test` | Confirmation d’un essai pour un client connecté |
| `/compte/commandes/[id]` | Détail et suivi d’un essai appartenant au client |
| `/gerant/connexion` | Connexion par lien privé |
| `/gerant/carte` | Édition de la carte, réservée au gérant |
| `/gerant/commandes-test` | Suivi simulé, réservé au gérant et à la cuisine |

## Parcours de test conseillé

1. Avec le compte gérant, renseigner les ingrédients retirables et les suppléments/prix d’une pizza.
2. Avec un compte client distinct créé sur `/compte`, composer une pizza et l’ajouter au panier.
3. Modifier sa recette depuis `/panier`, puis confirmer un essai sur `/commande/test`.
4. Consulter son détail et son historique dans l’espace client.
5. Avec le compte professionnel, simuler les étapes de préparation dans `/gerant/commandes-test`, puis actualiser le suivi client.

Le changement de mot de passe demande le mot de passe actuel et une confirmation. Il crée une nouvelle session pour le navigateur courant et déconnecte les autres sessions, y compris face à une connexion concurrente. Les coordonnées modifiées préremplissent les prochains essais et ne réécrivent pas l’historique.

## Livraison, retrait et limites actuelles

La livraison est gratuite. Seules les pizzas et les pâtes comptent pour le minimum : Namur centre = 1 plat ; Belgrade, Erpent et Saint-Servais = 2 plats. Une pizza 50 cm compte pour 2 ; une pizza 33 cm compte pour 2 à partir de 18 € par pizza, suppléments inclus ; les pâtes comptent pour 1. Salades, boissons et desserts sont exclus. Le retrait n’a pas de minimum de plats.

Choisir une zone ne vérifie pas une adresse. Les frontières de livraison, créneaux, capacités et exceptions d’horaires restent à confirmer avant des commandes réelles. Les jours fériés légaux belges affichent un service informatif 18h–22h, sauf dimanche fermé.

La vérification e-mail et la récupération du mot de passe sont disponibles avec Mailpit en local. Un service d’envoi externe, la suppression/export du compte et les exigences d’exploitation restent à préparer avant l’ouverture publique de l’espace client. La PWA, la traduction complète et les paiements sont des objectifs, pas des fonctions annoncées comme terminées.

## Vérifications

Après installation et génération du client Prisma :

```bash
npm run db:validate
npm run typecheck
npm test
npm run build
```

Les tests d’intégration (`npm run test:integration`) et navigateur (`npm run test:browser`) nécessitent un build, les migrations appliquées, `RUN_DATABASE_TESTS=1`, `ENABLE_TEST_ORDERS=true` et une base dédiée dont le nom finit par `_test`. Pour Chromium, installer au préalable le navigateur avec `npx playwright install chromium`. Ne pas utiliser une base contenant des données réelles.

La CI fournit PostgreSQL 16 dans une base jetable, valide/applique les migrations, vérifie TypeScript, lance les tests unitaires et d’intégration, compile Next.js puis teste sept parcours dans Chromium avec Mailpit. Les trois PR fusionnées ont passé ces contrôles.

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

En livraison simulée, `/commande/test` préremplit l’adresse par défaut et sa zone. Choisir une adresse dans la liste remplit les deux champs ; une saisie ponctuelle ne modifie pas le carnet. Les adresses sont privées à chaque compte et ne sont pas enregistrées dans le stockage local du navigateur. Une modification ou une suppression ne change pas l’adresse conservée dans les anciens essais. La zone reste déclarative : aucune vérification géographique ni réservation de livraison.

Cette évolution nécessite la migration `20261015120000_customer_addresses`, en suivant les commandes de mise à jour locale ci-dessus ; aucun seed supplémentaire. Deux modifications concurrentes ne s’écrasent pas : un conflit demande d’actualiser la liste.
