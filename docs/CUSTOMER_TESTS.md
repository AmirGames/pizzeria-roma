# Espace client et commandes de test

## Activation locale

Cette évolution s’appuie sur l’édition du panier (PR #21). Après installation des dépendances, appliquer les migrations, régénérer Prisma, puis ajouter dans le `.env` local :

```env
ENABLE_TEST_ORDERS=true
APP_ORIGIN=http://localhost:3000
```

Démarrer avec `npm run dev`. `/compte` propose inscription et connexion ; `/commande/test` permet de confirmer un essai à partir du panier catalogue. Utiliser des coordonnées fictives. Aucun e-mail n’est envoyé et aucun paiement n’est demandé. Le mode est désactivé par défaut ; les nouvelles API renvoient 404 si la variable ne vaut pas exactement `true`. La déconnexion reste disponible même après désactivation.

## Compte client

Un compte inscrit publiquement reçoit toujours le rôle CUSTOMER. Le navigateur ne peut pas fournir de rôle. Le mot de passe comporte au moins 12 caractères, au plus 256 octets UTF-8. Le hash utilise scrypt (N=32768, r=8, p=3), un sel aléatoire de 128 bits et une comparaison constante. Aucun mot de passe brut n’est conservé.

La session utilise le mécanisme existant : jeton aléatoire, seul son hash en base, cookie HttpOnly/SameSite=Lax, Secure hors développement. Elle dure sept jours ; une déconnexion supprime la session en base. Les mutations exigent du JSON de même origine. La connexion et l’inscription sont limitées en base à 10 tentatives par e-mail et 100 au total sur une fenêtre de 15 minutes. Les rôles, comptes désactivés et sessions révoquées sont contrôlés sur chaque accès.

Le client voit son nom, son e-mail, ses 50 derniers tests et leur détail. La consultation d’un test appartenant à une autre personne est refusée, même avec son identifiant. La vérification e-mail, la récupération du mot de passe et la suppression/export du compte restent à développer avant un espace client public. Pour les essais locaux, créer un autre compte fictif si nécessaire ; ne pas utiliser de données réelles.

## Enregistrement d’un test

Le client fournit identifiants de produits/options, quantités, coordonnées fictives, mode de récupération, commentaire et total qu’il vient de vérifier. Le serveur relit les produits actifs dans Prisma, vérifie formats/suppléments/retraits et minimum de plats, et recalcule le montant. Une différence de prix bloque la confirmation et demande d’actualiser le récapitulatif. Le montant fourni par le navigateur ne sert jamais à calculer le prix.

Les coordonnées sont requises pour cet essai. Une livraison simulée exige une zone connue et une adresse fictive, sans prétendre vérifier la couverture géographique. Aucune réservation d’horaire ni contrainte de capacité réelle n’est créée.

Un identifiant de confirmation associé au client empêche de créer deux fois le même test : les retries identiques renvoient l’enregistrement existant. Réutiliser cet identifiant avec des données différentes est refusé. Le formulaire conserve sa clé tant que les données ne changent pas ; un rechargement complet démarre un nouvel essai, donc vérifier l’historique avant de recommencer après une coupure.

Les tests sont conservés dans `TestOrder`, séparément de `Order`. Les prix, libellés, quantités, suppléments et retraits sont figés au moment de la confirmation. Une évolution du menu ne réécrit pas l’historique. Le panier retire uniquement les quantités confirmées et conserve les ajouts intervenus entre-temps.

## Suivi gérant et cuisine

`/gerant/commandes-test` est réservé aux rôles disposant de `orders:read` (MANAGER/KITCHEN). L’accès utilise la session professionnelle existante ; le client doit utiliser un compte distinct. Les actions exigent `orders:update-status`.

États simulés : enregistré → accepté → préparation → prêt → terminé pour un retrait ; une étape livraison simulée s’ajoute pour la livraison. Un test en attente peut être refusé ou annulé par son propriétaire ; un test accepté peut être annulé par le professionnel. Les transitions invalides et révisions obsolètes sont refusées. Les écrans précisent qu’aucune préparation réelle ne doit être lancée. Le suivi s’actualise via le bouton dédié.

## Tests

- Unitaires : hash et validation des mots de passe, données de confirmation, transitions et conservation des ajouts au panier.
- Intégration PostgreSQL/Next.js : mode désactivé, origine étrangère, rôle imposé, cookies, propriété des commandes, prix et minimum, double confirmation, historique figé, suivi professionnel, annulation, sessions et limites de connexion.
- Chromium : inscription, confirmation avec personnalisation, panier consommé, historique après reconnexion et annulation.

La CI utilise des comptes fictifs et une base jetable dont le nom finit par `_test`. Les scénarios ne doivent pas être exécutés sur une base commerciale. Les migrations ne sont jamais appliquées automatiquement hors CI.


## Profil et changement du mot de passe

Depuis `/compte`, ouvrir « Mes coordonnées et mon mot de passe ». Le nom et le téléphone du profil peuvent être modifiés ; le téléphone est facultatif et peut être effacé. Le nom et le téléphone préremplissent les futurs essais. Ils ne modifient pas les instantanés des commandes antérieures. L’adresse e-mail et le rôle ne sont pas modifiables depuis ce formulaire.

Le changement du mot de passe exige le mot de passe actuel, un nouveau mot de passe différent et une confirmation identique. Il utilise la même limitation des tentatives que la connexion. La mise à jour du hash, la suppression de toutes les sessions du compte et la création d’une nouvelle session sont regroupées dans une transaction. Le navigateur reçoit un nouveau cookie ; les anciens cookies, y compris celui de l’onglet courant, sont invalidés.

La connexion verrouille le hash qu’elle vient de vérifier jusqu’à la création de sa session. Une connexion concurrente avec l’ancien mot de passe ne peut donc pas recréer une session valide après la rotation. Deux changements concurrents ne peuvent pas s’écraser silencieusement : le hash attendu fait partie du contrôle de mise à jour.

Les tests PostgreSQL vérifient l’isolation du profil, la conservation de l’historique, la révocation des autres sessions, une connexion concurrente, le refus de l’ancien mot de passe et l’utilisation du nouveau. Un test Chromium couvre les formulaires, la confirmation, la persistance des coordonnées et une seconde session révoquée.
