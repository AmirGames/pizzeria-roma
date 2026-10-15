# Espace gérant

## Fonctionnement

`/gerant/carte` permet à un gérant connecté de modifier le nom français, la disponibilité et les prix des articles existants. Pour les pizzas : ingrédients retirables et suppléments avec prix fixe ou par format. Un tarif de format laissé vide signifie que le supplément n'est pas proposé dans ce format. Les prix nuls sont autorisés explicitement ; aucun tarif n'est inventé par le système.

Les formats existants sont conservés, avec prix et disponibilité modifiables. La création de produits, catégories et formats, la traduction anglaise et les allergènes ne font pas partie de cet écran. Retirer un supplément du formulaire le désactive en base ; il reste visible comme indisponible après rechargement. Au maximum 20 suppléments sont soumis dans une modification.

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

Cet accès par terminal permet d'utiliser l'éditeur sans service d'e-mail ni mot de passe partagé. La gestion des invitations depuis l'interface, le MFA, l'audit détaillé des modifications et la connexion client restent à développer. Aucune commande réelle ni paiement n'est activé.

Le seed du menu est un import explicite : le relancer réapplique les noms, prix et disponibilités du menu source et remplace les options qui lui appartiennent. Ne pas le relancer sur une carte modifiée sans vouloir restaurer ces données. Les ingrédients retirables et les suppléments créés par le gérant sont préservés.

## Vérifications

`npm test` couvre les règles de prix, les retraits, la validation des modifications, l'origine des requêtes et les jetons à usage unique. La CI crée PostgreSQL 16 dans une base jetable `roma_test`, applique toutes les migrations, valide Prisma, vérifie TypeScript, compile Next.js puis lance `npm run test:integration`. Ce test utilise les vraies routes et contrôle la connexion, le refus des accès anonymes et des origines étrangères, les mises à jour concurrentes, les options publiées, les devis par format, le changement de rôle et la déconnexion. Il ne s'exécute qu'avec `RUN_DATABASE_TESTS=1` et une base dont le nom finit par `_test`.
