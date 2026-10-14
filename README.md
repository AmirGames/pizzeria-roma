# Pizzeria Roma

Application de commande en ligne indépendante pour Pizzeria Roma (Namur).

## État

Projet en initialisation. Aucun paiement réel ni prise de commande en production.

## Objectifs

- Site client responsive et PWA, français et anglais.
- Catalogue et personnalisation des pizzas.
- Livraison par zones et retrait sur place.
- Paiement en ligne sécurisé et acceptation manuelle.
- Espace gérant et cuisine.

## Méthode

Développement par pull requests avec tests, revue et mise à jour de la documentation. Voir `docs/` dans les prochaines PR.

## Confidentialité

Ne jamais committer de secrets, clés API, coordonnées bancaires ou données réelles de clients.

## Développement local (préparation)

- Node.js 22, npm et Docker requis.
- `npm install`, `npm run typecheck`, `npm test`, `npm run build`.
- Pour préparer PostgreSQL : définir `POSTGRES_PASSWORD` et `DATABASE_URL` localement, puis `docker compose up -d db` et `npm run db:validate`.
- Ne pas exécuter de migration en production avant revue et validation.

**Attention :** les comptes et les sessions ne sont pas encore utilisables. Les fichiers Prisma et les règles d'autorisation sont uniquement des fondations.

## Authentification

La vérification de session côté serveur est en cours de construction. Aucun formulaire de connexion ou inscription n'est actif. Ne pas considérer les comptes comme prêts pour la production.

## Catalogue (en cours)

Un modèle de tailles et suppléments ainsi qu'un calculateur de prix testable ont été ajoutés. Les prix réels et les allergènes doivent être validés par la pizzeria. Aucune commande n'est encore possible.

## Aperçu du menu

Démarrer avec `npm run dev` puis ouvrir `http://localhost:3000/menu`. La page affiche les produits, tailles et suppléments actifs publiés dans le catalogue Prisma. Si aucun produit n'a été validé ou si le catalogue est indisponible, elle affiche un état explicite. Aucun allergène n'est inventé et aucun achat n'est possible.

## Personnalisation des pizzas (préparation)

La page `/menu/personnaliser` présente les options prévues. Les modules de validation et de devis sont testés séparément. **Aucun panier, commande ou paiement n'est actif.** Voir `docs/PIZZA_CUSTOMIZATION.md`.

## Panier de démonstration — PR-07 et PR-09

Ouvrir `/panier` pour tester une interface responsive avec produit et tarif **fictifs**, quantités, suppression et commentaire. Aucune commande ni paiement n'est possible. Le panier de démonstration reste disponible. Les articles du catalogue peuvent aussi être ajoutés au panier sous forme d'identifiants ; leurs prix et règles sont recalculés par l'API serveur. Aucune commande ni paiement n'est créé. Voir `docs/CART.md`.

## Livraison et retrait (aperçu local)

La page `/commande` affiche les règles selon le mode livraison/retrait et la zone choisie. Avec une sélection catalogue, les prix et règles sont recalculés côté serveur ; le panier de démonstration reste une simulation locale. Aucune adresse ni commande n'est validée. La route `POST /api/cart/preview` relit les produits et prix depuis Prisma. La route publique du catalogue ne retourne que les données actives configurées dans Prisma. Voir `docs/FULFILLMENT.md` et `docs/CATALOG.md`.

**Règle de livraison confirmée :** seules les pizzas et les pâtes comptent dans le minimum de plats par zone. Erpent = 2 plats. Les autres zones manuscrites restent à valider géographiquement avant activation.

**Pizza maxi 50 cm :** compte pour 2 plats dans les minima de livraison, indépendamment de son prix. Pizza 33 cm et pâtes : 1 plat. Le serveur devra identifier la taille depuis le catalogue fiable, pas depuis une déclaration du client.

**Seuil de 18 € par pizza :** une pizza normale 33 cm atteint 2 plats équivalents lorsque son prix unitaire configuré, suppléments inclus, atteint 18 €. En dessous, elle compte pour 1. Une maxi 50 cm compte toujours pour 2. Le serveur doit recalculer le prix à partir de la base de données, jamais depuis le navigateur.
