# Livraison, retrait et horaires — PR-08

## Fonctionnel (fondations)
- Livraison gratuite pour les quatre zones envisagées : Namur centre (1 plat principal), Belgrade (2), Erpent (2), Saint-Servais (2).
- Retrait sans minimum de livraison ; préparation estimée 30–40 minutes.
- Horaires : lundi à vendredi 11h30–14h00 et 18h00–22h00, samedi 18h00–22h00, dimanche fermé.
- Moteur de règles pur testé : `evaluateDelivery`, `serviceWindows`, `isWithinService`.
- Page `/commande` responsive inspirée de la maquette, avec choix livraison/retrait, zone et simulation du nombre de plats.

## Définition confirmée par le restaurateur
Le minimum de livraison porte sur les **pizzas et les plats de pâtes uniquement**, en additionnant les quantités, avec une **pizza maxi 50 cm comptant pour 2 plats**, une pizza normale 33 cm pour 1 plat et des pâtes pour 1 plat. Par exemple, une pizza normale et un plat de pâtes = 2 plats admissibles ; une seule pizza maxi = 2 plats admissibles. Le prix payé n'influence pas ce comptage. Salades, desserts et boissons exclus. Le moteur `countEligibleDishes` fournit le comptage à partir de catégories et tailles **de confiance côté serveur** ; ne jamais croire les catégories déclarées par le navigateur. Erpent corrigé à 2 plats selon la liste manuscrite.

La liste manuscrite comporte d'autres localités qui attendent une relecture des noms et une définition géographique avant activation.

## Limites critiques
La sélection de zone ne prouve pas qu'une adresse est desservie. Aucun géocodage, aucune validation d'adresse, aucun créneau réel ni commande active. Le nombre de plats est une **simulation** saisie manuellement, et non un panier contrôlé. Les horaires sont les horaires locaux du restaurant ; les fonctions prennent explicitement le jour de semaine et l'heure locale, sans conversion de fuseau.

**Avant activation du checkout :** associer les produits aux plats principaux, recalculer le panier côté serveur, vérifier l'adresse/zone avec une source fiable et des règles approuvées, appliquer les horaires et les capacités de production, réserver des créneaux, gérer les précommandes et le fuseau Europe/Brussels. Ne pas utiliser la sélection client comme preuve d'éligibilité.
