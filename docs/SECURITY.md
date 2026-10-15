# Sécurité et authentification — PR-02

## Modèle initial
- Rôles : CUSTOMER, MANAGER, KITCHEN. Rôle par défaut : CUSTOMER.
- Autorisations explicites dans `src/lib/authorization.mjs`, refus par défaut.
- Sessions prévues : jeton aléatoire 256 bits, uniquement son SHA-256 stocké en base.
- Les rôles doivent être obtenus depuis une session validée côté serveur, jamais depuis le navigateur.
- Une commande invitée ne doit pas être accessible à partir de sa seule référence publique.

## Non implémenté — bloquant avant toute mise en production
- Connexion et vérification e-mail des clients.
- Limitation des tentatives pour les futurs accès par mot de passe et flux d’e-mail.
- MFA des gérants, réinitialisation de compte et journal d'audit.
- Vérification des autorisations sur chaque endpoint et accès aux commandes par propriétaire.
- Gestion RGPD, suppression/export, politique de conservation.
- Migrations appliquées et testées sur PostgreSQL, sauvegarde et restauration.

Le périmètre d’accès gérant actuel est décrit ci-dessous ; les comptes clients et la prise de commandes restent hors de ce périmètre.

## PR-02b : lecture des sessions
- Vérification serveur d'une session par hash, expiration, révocation et désactivation de l'utilisateur.
- Permissions vérifiées à partir du rôle lu en base.
- Politique de cookie HttpOnly/Secure/SameSite testée.
- Une connexion gérant par jeton temporaire à usage unique et une déconnexion serveur sont disponibles. Voir [MANAGER.md](MANAGER.md). Le jeton de 256 bits est généré depuis un terminal administrateur, dure 15 minutes et est stocké uniquement sous forme de hash. La consommation du lien et la création de session sont atomiques. Les mutations exigent du JSON de même origine. Aucun mot de passe partagé, inscription publique ou compte client connecté n’est introduit.

## Proposition — comptes clients et commandes simulées

Le mode explicite `ENABLE_TEST_ORDERS=true` ajoute l’inscription et la connexion CUSTOMER par mot de passe scrypt, sessions serveur et protection d’origine. La limitation en base couvre chaque adresse e-mail et le total des tentatives. Les essais sont isolés dans `TestOrder` ; leur consultation exige la propriété côté serveur et les actions professionnelles vérifient les permissions existantes. Ce mode n’active aucune commande commerciale. La vérification e-mail, la récupération de compte et les obligations d’exploitation restent à traiter avant publication du service client. Voir [CUSTOMER_TESTS.md](CUSTOMER_TESTS.md).

Le changement de mot de passe authentifié exige l’ancien secret et révoque les sessions existantes dans une transaction. La connexion compare et verrouille le hash vérifié jusqu’à l’émission de session pour éviter une réémission concurrente fondée sur l’ancien mot de passe. Les modifications de profil sont limitées au nom et au téléphone du compte CUSTOMER connecté.
