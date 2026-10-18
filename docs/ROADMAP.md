# Roadmap

## État du projet

Le dépôt local comprend le storefront, le catalogue, l’édition du panier, l’espace client en mode test, les outils gérant/cuisine et le socle serveur des commandes Stripe réelles. Le flux commercial reste désactivé par défaut et n’est pas prêt pour une ouverture publique.

Les commandes de test sont isolées dans `TestOrder`. Elles ne déclenchent ni paiement, ni préparation réelle, ni réservation opérationnelle. La fusion du code ne déploie pas le site et n’applique aucune migration à une base.

## À obtenir ou confirmer auprès du restaurant

- [ ] Fournir la composition exacte des pizzas et les tarifs de chaque supplément, par format.
- [ ] Confirmer les allergènes et les disponibilités des produits.
- [ ] Confirmer les jours fériés de remplacement et les exceptions d’horaires.
- [ ] Confirmer les frontières de livraison, minima et réglages opérationnels avant toute ouverture commerciale.

Les informations manquantes ne doivent pas être déduites des noms des plats ou inventées dans le seed.

## Avant une éventuelle prise de commandes commerciales

- [x] Socle serveur Stripe Checkout : prix et créneaux recalculés côté serveur, paiements Bancontact et carte (Apple Pay/Google Pay selon l’appareil), confirmation signée par webhook, file cuisine et ticket imprimable depuis le navigateur.
- [ ] Créer/configurer le compte Stripe marchand, tester en mode test et activer explicitement les moyens de paiement. PayPal n’est pas prévu.
- [x] Implémenter l’espace client des commandes réelles, l’historique/détail, les promotions dont l’offre première commande, les avoirs et remboursements gérant.
- [ ] Appliquer les migrations réelles et tester le parcours complet paiement, avoir, remboursement, annulation et offre première commande avec Stripe en mode test.
- [ ] Confirmer les informations légales, CGV, fiscalité, prix, disponibilité, horaires, zones/minima et capacités opérationnelles.
- [ ] Préparer le pilote, la surveillance, les sauvegardes et les procédures d’exploitation.
- [ ] Identifier l’imprimante et son ordinateur. L’impression actuelle ouvre la boîte d’impression du navigateur et nécessite une action du personnel.
- [ ] Configurer et tester le compte Resend, le domaine expéditeur et la délivrabilité, puis valider/documenter la conservation des données de commande avant l’ouverture publique. Le branchement d’envoi client Resend est implémenté ; la suppression authentifiée du compte anonymise/dissocie les commandes réelles terminées et bloque les commandes ou avoirs actifs.

Les commandes réelles restent désactivées tant que `ENABLE_REAL_ORDERS` n’est pas exactement `true`. Une clé Stripe `sk_live_` est aussi refusée sans `ENABLE_LIVE_PAYMENTS=true` et une origine HTTPS. Ne pas activer ces variables avant l’achèvement des points restants.

## Améliorations produit envisagées

- [x] PWA installable avec manifeste, icônes et page de secours hors ligne. Le catalogue, les prix et le checkout demandent toujours une connexion ; aucune commande n’est mise en attente hors ligne.
- [ ] Traduction anglaise complète de la boutique, du panier, du checkout, des e-mails et de l’espace client.
- [ ] Compléter les exigences de protection et d’exploitation des comptes clients pour une ouverture publique.

## Fonctionnalités déjà livrées

- Catalogue du menu daté, panier avec validation des prix côté serveur, personnalisation des pizzas, promotions, fidélité et gestion de la carte.
- Comptes clients de test, adresses privées, export JSON, historique et reprise de sélection, vérification e-mail et récupération de mot de passe locales.
- Catalogue public mis en cache côté serveur ; les modifications du menu dans l’espace gérant invalident immédiatement le cache.
- Fidélité des commandes réelles réservée au checkout, comptabilisée après terminaison, et détail de commande/exports présentant le calcul des remises.
- Connexion, inscription, gestion du profil et des adresses activées quand les commandes réelles sont actives ; suppression du compte protégée par mot de passe, avec conservation prudente des commandes terminées et blocage en cas de commande ou d’avoir en cours.
- Checkout réel connecté au carnet d’adresses client ; l’adresse enregistrée est revalidée contre les zones de livraison au checkout.
- Tableau de bord gérant avec compteurs des commandes payées et chiffre du jour, plus suivi séparé des essais ; file gérant/cuisine actualisée automatiquement toutes les 20 secondes quand elle est visible, zones et créneaux.
- Rapport financier gérant par période, avec ventes brutes/nettes, remboursements, avoirs, remises, répartition retrait/livraison, détail journalier et export CSV compatible avec Excel ; paiements Stripe de test exclus des ventes réelles.
- Page de secours accessible lorsque les services serveur requis sont indisponibles, avec action de nouvelle tentative sans divulgation des détails internes.
- Corrections de production, CI et affichage mobile jusqu’à la PR #33.

Les règles de livraison et de retrait documentées dans le README restent les règles de référence. Ne pas modifier les règles concernant les desserts sans confirmation du restaurant.

À chaque PR, ajouter les vérifications adaptées et synchroniser le README, le changelog et la documentation fonctionnelle concernée.
