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
