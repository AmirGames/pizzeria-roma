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

Démarrer avec `npm run dev` puis ouvrir `http://localhost:3000/menu`. La page présente uniquement les catégories : aucun produit, prix, allergène ou moyen de paiement réel n'y est affiché.

## Personnalisation des pizzas (préparation)

La page `/menu/personnaliser` présente les options prévues. Les modules de validation et de devis sont testés séparément. **Aucun panier, commande ou paiement n'est actif.** Voir `docs/PIZZA_CUSTOMIZATION.md`.

## Panier de démonstration — PR-07

Ouvrir `/panier` pour tester une interface responsive avec produit et tarif **fictifs**, quantités, suppression et commentaire. Aucune commande ni paiement n'est possible. Voir `docs/CART.md`.

## Livraison et retrait (préparation)

La page `/commande` permet de visualiser les modes livraison/retrait et les minima indicatifs par zone. Aucune adresse n'est validée ni commande enregistrée. Voir `docs/FULFILLMENT.md`.

**Règle de livraison confirmée :** seules les pizzas et les pâtes comptent dans le minimum de plats par zone. Erpent = 2 plats. Les autres zones manuscrites restent à valider géographiquement avant activation.
