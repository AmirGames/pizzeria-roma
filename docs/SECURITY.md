# Sécurité et authentification — PR-02

## Modèle initial
- Rôles : CUSTOMER, MANAGER, KITCHEN. Rôle par défaut : CUSTOMER.
- Autorisations explicites dans `src/lib/authorization.mjs`, refus par défaut.
- Sessions prévues : jeton aléatoire 256 bits, uniquement son SHA-256 stocké en base.
- Les rôles doivent être obtenus depuis une session validée côté serveur, jamais depuis le navigateur.
- Une commande invitée ne doit pas être accessible à partir de sa seule référence publique.

## État sécurité et éléments à terminer avant la mise en production
- Connexion, vérification e-mail, récupération du mot de passe et limitation en base des tentatives clients sont implémentées. Les liens passent par Mailpit en mode test et Resend en mode commandes réelles lorsque `RESEND_API_KEY`, `CONTACT_FROM_EMAIL` et `APP_ORIGIN` sont configurés. Le compte marchand Resend et la délivrabilité du domaine doivent être vérifiés avant publication.
- MFA des gérants, procédure de récupération et journal d’audit restent à ajouter.
- Les autorisations sont contrôlées côté serveur ; les accès client réels reposent sur la propriété de la commande.
- Export client en JSON et suppression authentifiée du compte disponibles. La suppression efface le profil, les adresses, les identifiants et les commandes de test ; les commandes réellement payées sont dissociées du compte et privées de leurs coordonnées de contact. Les commandes en cours ou les avoirs restants bloquent la suppression. La durée de conservation comptable et les autres obligations de conservation restent à valider et documenter avant une ouverture publique.
- Les migrations et parcours doivent être appliqués et testés sur PostgreSQL ; sauvegarde et restauration restent à préparer.

Le périmètre d’accès gérant et client est détaillé ci-dessous. Le mode test et le checkout réel sont explicitement activés par des variables séparées.

## PR-02b : lecture des sessions
- Vérification serveur d'une session par hash, expiration, révocation et désactivation de l'utilisateur.
- Permissions vérifiées à partir du rôle lu en base.
- Politique de cookie HttpOnly/Secure/SameSite testée.
- Une connexion gérant par jeton temporaire à usage unique et une déconnexion serveur sont disponibles. Voir [MANAGER.md](MANAGER.md). Le jeton de 256 bits est généré depuis un terminal administrateur, dure 15 minutes et est stocké uniquement sous forme de hash. La consommation du lien et la création de session sont atomiques. Les mutations exigent du JSON de même origine. Aucun mot de passe partagé, inscription publique ou compte client connecté n’est introduit.

## Comptes clients et commandes simulées

Le mode explicite `ENABLE_TEST_ORDERS=true` ajoute l’inscription et la connexion CUSTOMER par mot de passe scrypt, sessions serveur et protection d’origine. La limitation en base couvre chaque adresse e-mail et le total des tentatives. Les essais sont isolés dans `TestOrder` ; leur consultation exige la propriété côté serveur et les actions professionnelles vérifient les permissions existantes. Ce mode n’active aucune commande commerciale. La vérification e-mail et la récupération de compte utilisent Mailpit en local ; l’envoi externe et les obligations d’exploitation restent à préparer avant publication du service client. Voir [CUSTOMER_TESTS.md](CUSTOMER_TESTS.md).

Le changement de mot de passe authentifié exige l’ancien secret et révoque les sessions existantes dans une transaction. La connexion compare et verrouille le hash vérifié jusqu’à l’émission de session pour éviter une réémission concurrente fondée sur l’ancien mot de passe. Les modifications de profil sont limitées au nom et au téléphone du compte CUSTOMER connecté.

## Stripe et commandes réelles — désactivés par défaut

Le socle de commande réelle crée une Checkout Session Stripe côté serveur. Les prix et créneaux sont relus et réservés sous verrou de configuration avant la redirection. Le navigateur ne confirme jamais une commande payée : `/api/stripe/webhook` vérifie la signature HMAC Stripe sur le corps brut, déduplique les événements en base et n’envoie en préparation qu’une session payée dont montant, devise et référence correspondent à la commande. Les moyens configurés sont `card` et `bancontact`; Apple Pay et Google Pay peuvent apparaître comme wallets de carte pris en charge par Stripe Checkout. PayPal n’est pas configuré.

`ENABLE_REAL_ORDERS` doit valoir exactement `true` pour ouvrir le checkout. Une clé test `sk_test_` est nécessaire au pilote; une clé `sk_live_` est refusée sans `ENABLE_LIVE_PAYMENTS=true` et `APP_ORIGIN` en HTTPS. Configurer aussi `STRIPE_WEBHOOK_SECRET` et abonner Stripe aux événements `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired`, `charge.refunded` et `refund.failed`. Ne jamais stocker les clés dans Git.

En local, écouter ces événements avec Stripe CLI : `stripe listen --events "checkout.session.completed,checkout.session.async_payment_succeeded,checkout.session.async_payment_failed,checkout.session.expired,charge.refunded,refund.failed" --forward-to http://localhost:3000/api/stripe/webhook`. Le remboursement depuis l’espace gérant est complet et réservé aux rôles MANAGER ; un remboursement en attente apparaît comme « Remboursement à traiter » jusqu’au webhook Stripe.

`GET /api/health` ne retourne que `ok` ou `unavailable` selon une requête `SELECT 1` à PostgreSQL ; il ne révèle ni noms de base, ni clés, ni état détaillé des services.

Ce socle ne constitue pas encore une autorisation de mise en production : l’application et le test de la migration des avoirs, les parcours avoir/remboursement en mode test, les remises en commande réelle, les courriels externes, l’impression sans intervention et la validation opérationnelle/légale restent à terminer.

## E-mails capturés localement

En mode test, les liens de vérification/récupération sont envoyés exclusivement à Mailpit sur une adresse de boucle locale. En mode réel, ils utilisent Resend et l’origine HTTPS `APP_ORIGIN`. Les jetons sont aléatoires, hachés en base, limités à une finalité, expirent et sont consommés atomiquement. La récupération ne révèle pas l’existence d’un compte, n’ouvre pas de session automatiquement et révoque les anciennes sessions. Une version de mot de passe invalide les liens de récupération lors d’une rotation. Le service d’envoi et le domaine expéditeur doivent être configurés avant publication.
