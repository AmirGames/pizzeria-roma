# Architecture — proposition initiale

Application Next.js TypeScript autonome. À confirmer avant PR-02 : PostgreSQL/Prisma pour données métier, séparation des rôles et des secrets, hébergement UE, sauvegardes hors site testées.

Architecture réutilisable **par déploiement indépendant** : base de données, domaine, clés de paiement et secrets distincts pour chaque établissement. Aucun mélange avec ZupEat.

Cette PR fournit uniquement un squelette web statique non transactionnel. Pas d'API, pas de DB, pas de paiements ni de PWA installable à ce stade.

## PR-02 : schéma et rôles

Schéma Prisma pour utilisateurs, sessions, catégories, produits et commandes (structure préliminaire). PostgreSQL via Docker Compose local. Les tables ne sont pas encore migrées en production. Les fonctions de permissions sont isolées et testées ; aucune route d'authentification n'est exposée.
