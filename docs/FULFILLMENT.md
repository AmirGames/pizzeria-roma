# Livraison, retrait et horaires — PR-08

## Fonctionnel (fondations)
- Livraison gratuite pour les quatre zones envisagées : Namur centre (1 plat principal), Belgrade (2), Erpent (2), Saint-Servais (2).
- Retrait sans minimum de livraison ; préparation estimée 30–40 minutes.
- Horaires : lundi à vendredi 11h30–14h00 et 18h00–22h00, samedi 18h00–22h00, dimanche fermé.
- Moteur de règles pur testé : `evaluateDelivery`, `serviceWindows`, `isWithinService` et `isWithinRestaurantService`.
- Page `/commande` responsive avec choix livraison/retrait et zone. Le panier de démonstration garde son aperçu local ; les sélections catalogue passent par l'API de prévisualisation serveur.

## Définition confirmée par le restaurateur
Le minimum de livraison porte sur les **pizzas et les plats de pâtes uniquement**, en additionnant les quantités, avec une **pizza maxi 50 cm comptant pour 2 plats**, une pizza normale 33 cm pour 1 plat si son prix unitaire configuré est inférieur à 18 € et pour 2 plats dès 18 € (suppléments inclus) et des pâtes pour 1 plat. Par exemple, une pizza normale et un plat de pâtes = 2 plats admissibles ; une seule pizza maxi = 2 plats admissibles. Le seuil de 18 € est calculé par pizza, après suppléments et avant multiplication par la quantité ; il ne s'applique pas au total du panier. Une maxi 50 cm compte toujours pour 2 plats. Salades, desserts et boissons exclus. Le moteur `countEligibleDishes` fournit le comptage à partir de catégories, tailles et prix unitaires configurés **de confiance côté serveur** ; ne jamais croire les catégories déclarées par le navigateur. Erpent corrigé à 2 plats selon la liste manuscrite.

La liste manuscrite comporte d'autres localités qui attendent une relecture des noms et une définition géographique avant activation.

## Limites critiques
La sélection de zone ne prouve pas qu'une adresse est desservie. Aucun géocodage, aucune validation d'adresse, aucun créneau réel ni commande active. Le panier de démonstration reste local et non fiable. Pour les sélections catalogue, la route de prévisualisation relit prix, tailles et catégories depuis Prisma. Les horaires sont ceux du restaurant en `Europe/Brussels`. `isWithinService` accepte un jour et une heure locale explicites ; `isWithinRestaurantService` convertit un instant réel avec ce fuseau et vérifie les horaires hebdomadaires. L’indicateur affiché sur `/commande` est informatif : il ne connaît pas les jours fériés, ne réserve pas de créneau et ne conditionne pas une commande. Les horaires spéciaux des jours fériés doivent être confirmés et gérés séparément. Les sélections catalogue sont stockées localement sous forme d'identifiants uniquement ; le calcul des prix et des règles associées est effectué par le serveur. L'adresse et les créneaux restent des démonstrations.

**Avant activation du checkout :** associer les produits aux plats principaux, recalculer le panier côté serveur, vérifier l'adresse/zone avec une source fiable et des règles approuvées, appliquer les horaires et les capacités de production, réserver des créneaux, gérer les précommandes et le fuseau Europe/Brussels. Ne pas utiliser la sélection client comme preuve d'éligibilité.


## PR-17 — Statut des horaires habituels

La page `/commande` affiche si l’établissement est ouvert selon les horaires hebdomadaires, calculés dans le fuseau `Europe/Brussels` et rafraîchis chaque minute. Le statut ne tient pas compte des exceptions des jours fériés ; l’interface l’indique et il n’active pas le checkout.


## PR-12 — Aperçu serveur du panier catalogue
`/commande` envoie les IDs produit/taille/suppléments et les quantités à `POST /api/cart/preview`. Le serveur relit les données actives dans Prisma et applique les règles existantes. Le panier fictif conserve son aperçu local. Aucune adresse n'est vérifiée et aucune commande/paiement n'est créé ; les desserts restent hors du décompte comme avant.
