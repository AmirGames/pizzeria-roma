# Sécurité et authentification — PR-02

## Modèle initial
- Rôles : CUSTOMER, MANAGER, KITCHEN. Rôle par défaut : CUSTOMER.
- Autorisations explicites dans `src/lib/authorization.mjs`, refus par défaut.
- Sessions prévues : jeton aléatoire 256 bits, uniquement son SHA-256 stocké en base.
- Les rôles doivent être obtenus depuis une session validée côté serveur, jamais depuis le navigateur.
- Une commande invitée ne doit pas être accessible à partir de sa seule référence publique.

## Non implémenté — bloquant avant toute mise en production
- Connexion et vérification e-mail réelles, émission/validation/révocation des sessions.
- Cookies HttpOnly, Secure, SameSite ; protection CSRF, limitation des tentatives.
- MFA des gérants, réinitialisation de compte et journal d'audit.
- Vérification des autorisations sur chaque endpoint et accès aux commandes par propriétaire.
- Gestion RGPD, suppression/export, politique de conservation.
- Migrations appliquées et testées sur PostgreSQL, sauvegarde et restauration.

Ne pas utiliser ce squelette comme un système d'authentification opérationnel.

## PR-02b : lecture des sessions
- Vérification serveur d'une session par hash, expiration, révocation et désactivation de l'utilisateur.
- Permissions vérifiées à partir du rôle lu en base.
- Politique de cookie HttpOnly/Secure/SameSite testée.
- **Il n'existe toujours pas d'endpoint de connexion, d'inscription ni d'émission de cookie.** Le cookie doit être défini seulement par un futur flux serveur sécurisé.
