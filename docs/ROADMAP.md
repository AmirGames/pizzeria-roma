# Roadmap GitHub

Les lignes initiales décrivent les jalons produit ; les sections « numérotation GitHub » suivent les PR réellement ouvertes dans le dépôt.

- [x] PR-01 : squelette Next.js, CI, page temporaire et documentation initiale (en attente de validation de la PR).
- [ ] PR-02 : schéma DB et règles d'autorisation initiales ; authentification réelle encore à implémenter (PR en cours).
- [ ] PR-02b : vérification des sessions et permissions côté serveur (PR en cours, connexion réelle à faire).
- [ ] PR-03 : modèles tailles/suppléments et moteur de calcul (en cours ; interface et API à venir).
- [ ] PR-04 : panier et validation serveur.
- [ ] PR-05 : zones, horaires et précommandes.
- [ ] PR-06 : PSP, webhooks et remboursements.
- [ ] PR-07 : gestion des commandes, cuisine et tickets.
- [ ] PR-08 : PWA, comptes, e-mails FR/EN.
- [ ] PR-09 : déploiement, sauvegardes et surveillance.
- [ ] PR-10 : recette, tests réels et pilote.

À chaque PR : tests, mise à jour du README et du CHANGELOG, documentation fonctionnelle concernée.

- [ ] PR-04b : interface de présentation du menu sans prix réels (en cours).

- [ ] PR-06 : validation des options pizza, devis et page de présentation (en cours ; interface transactionnelle à venir).

- [ ] PR-07 (numérotation GitHub) : panier de démonstration responsive, logique locale testée ; connexion au catalogue et validation serveur à venir.

- [ ] PR-08 (numérotation GitHub) : interface livraison/retrait et règles de zones/horaires testées ; adresse, créneaux et commande réels à faire.

## PR-09 — Panier et aperçu livraison/retrait
- [x] Partager le panier de démonstration entre `/panier` et `/commande` dans le stockage local du navigateur.
- [x] Calculer les plats admissibles depuis les lignes du panier selon les règles de livraison existantes.
- [x] Conserver le retrait sans minimum, les zones et minima actuels ; aucun changement aux règles de catégories.
- [ ] Remplacer les données fictives par un catalogue fiable et recalculer les règles côté serveur avant activation.


## PR-10 (numérotation GitHub) — Aperçu serveur du panier, empilée sur PR-09
- [x] Accepter uniquement des identifiants d'articles/options et des quantités.
- [x] Recharger prix, catégories, tailles et suppléments depuis Prisma pour établir l'aperçu.
- [x] Garder les catégories non classées dans `OTHER` par défaut ; ne pas reclasser les desserts.
- [ ] Charger les produits/prix réellement approuvés et relier l'interface à l'API avant d'envisager toute commande.
