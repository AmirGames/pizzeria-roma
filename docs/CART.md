# Panier et interface — PR-07

## Réalisé
- Page `/panier` responsive, conforme à la direction artistique de la maquette fournie (vert profond, crème, rouge).
- État local en mémoire : ajout d'un produit **fictif et explicitement identifié**, modification de quantité, suppression, commentaire.
- Sous-total en centimes avec protections contre valeurs invalides et dépassements.
- Tests unitaires de calcul et de mutations.
- Bouton de commande désactivé.

## Limites de sécurité
Le panier client **n'est pas une source de prix fiable**. Aucun prix du navigateur ne doit être accepté lors de la commande. Une future API devra recharger le catalogue et ses options depuis Prisma, valider la disponibilité et recalculer le total côté serveur.

Aucune persistance, commande, réservation, paiement, information personnelle ou donnée réelle de la carte. Le produit et son tarif de démonstration ne sont pas une offre commerciale.

## Prochaines étapes
- Alimenter la carte depuis des produits approuvés en base.
- Ajouter des produits réels configurés (tailles, suppléments et retraits).
- Persistance contrôlée du panier, contrôles de disponibilité, devis serveur.
- Parcours livraison/retrait et paiement seulement après validation des étapes précédentes.
