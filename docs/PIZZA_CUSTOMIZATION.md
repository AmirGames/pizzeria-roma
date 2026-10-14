# Personnalisation des pizzas — PR-06

## Implémenté
- Validation des identifiants de taille, suppléments et retraits contre un objet produit de confiance.
- Rejet des tailles inactives, suppléments inexistants ou doublons, ingrédients non autorisés.
- Calcul des montants en centimes entiers par un module indépendant.
- Page de présentation accessible via `/menu/personnaliser`, sans commande ni tarifs fictifs.

## À implémenter avant commandes
- Modèle des ingrédients et liens aux produits en base.
- Lecture du catalogue depuis Prisma côté serveur et autorisations d'administration.
- Contrôle des tailles et options compatibles par produit, limites commerciales.
- Interface interactive accessible et sauvegarde du choix dans un panier serveur.
- Validation des allergènes par la pizzeria.
- Moitié-moitié : politique et tarification à confirmer, non prise en charge.

## Règle de sécurité
Les requêtes client transmettent uniquement les identifiants d'options et les quantités. **Le serveur charge les tarifs en base, vérifie la disponibilité et recalcule chaque total**. Le module de devis ne doit pas être exposé en acceptant un objet produit fourni par le client.
