# Catalogue et tarification

## Source du menu

La carte datée du 14/10/2026 fournie par le restaurant est transcrite dans [RESTAURANT_MENU_SOURCE.md](RESTAURANT_MENU_SOURCE.md). Les données structurées se trouvent dans `prisma/menu-2026-10-14.mjs`.

- 43 pizzas avec les prix indiqués pour 33 cm et 50 cm ; aucune taille maxi n'est créée pour la Calzone.
- 20 plats de pâtes ; les 14 plats sans forme spécifique proposent spaghetti, macaroni ou tagliatelle. La tagliatelle est tarifée 1,00 € de plus.
- Le supplément parmesan ou gruyère est un choix unique à 2,50 €.
- Les accompagnements, 10 salades, l'ossobuco, les boissons et les desserts sont également transcrits.
- Les suppléments pizza restent absents du seed : la carte indique seulement des prix « à partir de » et ne fournit pas la liste des ingrédients/options ni leurs prix individuels.
- Aucun allergène n'est déclaré ou déduit.

## Chargement de la carte

Après application des migrations, `npm run db:seed` synchronise ces données dans la base indiquée par `DATABASE_URL`. Le seed n'est pas exécuté par le build ou le déploiement. Il crée des produits actifs visibles dans `GET /api/catalog` ; l'exécuter uniquement sur une base où l'on souhaite publier cette carte. Il ne crée ni commandes ni paiements. Les options dont l'identifiant commence par `menu-20261014-` sont gérées par le seed.

## Choix et calcul des prix

Les prix restent en centimes entiers et sont toujours relus côté serveur à partir de Prisma ; le navigateur ne transmet que des identifiants d'options.

- `ProductSize` porte les deux formats de pizza et les formes de pâtes/dessert à choix. Pour une forme, son prix est le prix final du produit, supplément tagliatelle compris.
- `choiceLabel` indique le libellé du menu à afficher au-dessus d'un choix exclusif.
- `extraSelectionMode` vaut `SINGLE` pour les extras fromage des pâtes. Le serveur rejette plusieurs suppléments sélectionnés dans ce mode.
- Les pizzas conservent le mode multi-suppléments existant ; aucun supplément pizza n'est préchargé sans tarifs individuels.
- Salades, viande, boissons et desserts sont `OTHER` pour le fulfillment. La règle des desserts n'est pas modifiée.

## Tests et sécurité

Les tests de catalogue contrôlent les prix en centimes, l'unicité des identifiants de seed, les tailles disponibles, le choix de pâtes, les suppléments exclusifs, et la classification des catégories. `POST /api/cart/preview` vérifie le produit, l'option, les extras et leur prix depuis la base avant de retourner un aperçu.

Le calculateur `menu-pricing.mjs` n'accepte jamais un prix fourni par le navigateur. Aucune adresse n'est vérifiée et aucun achat, paiement ou ordre de cuisine n'est possible.

## Évolution historique

- PR-10 : prévisualisation serveur fondée sur les données Prisma et classification explicite du fulfillment.
- PR-11 : publication en lecture seule du catalogue actif par `GET /api/catalog`.
- PR-12 : sélection catalogue dans le panier, recalcul des prix et règles côté serveur.
- PR-15 : options de pâtes et de fromage, seed du menu courant et affichage des choix exclusifs.
