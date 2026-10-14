# Livraison, retrait et horaires — PR-08

## Fonctionnel (fondations)
- Livraison gratuite pour les quatre zones envisagées : Namur centre (1 plat principal), Belgrade (2), Erpent (2), Saint-Servais (2).
- Retrait sans minimum de livraison ; préparation estimée 30–40 minutes.
- Horaires : lundi à vendredi 11h30–14h00 et 18h00–22h00, samedi 18h00–22h00, dimanche fermé.
- Moteur de règles pur testé : `evaluateDelivery`, `serviceWindows`, `isWithinService`.
- Page `/commande` responsive avec choix livraison/retrait et zone. L'aperçu compte désormais les plats à partir des lignes du panier de démonstration partagé ; le champ de simulation manuelle a été retiré.

## Définition confirmée par le restaurateur
Le minimum de livraison porte sur les **pizzas et les plats de pâtes uniquement**, en additionnant les quantités, avec une **pizza maxi 50 cm comptant pour 2 plats**, une pizza normale 33 cm pour 1 plat si son prix unitaire configuré est inférieur à 18 € et pour 2 plats dès 18 € (suppléments inclus) et des pâtes pour 1 plat. Par exemple, une pizza normale et un plat de pâtes = 2 plats admissibles ; une seule pizza maxi = 2 plats admissibles. Le seuil de 18 € est calculé par pizza, après suppléments et avant multiplication par la quantité ; il ne s'applique pas au total du panier. Une maxi 50 cm compte toujours pour 2 plats. Salades, desserts et boissons exclus. Le moteur `countEligibleDishes` fournit le comptage à partir de catégories, tailles et prix unitaires configurés **de confiance côté serveur** ; ne jamais croire les catégories déclarées par le navigateur. Erpent corrigé à 2 plats selon la liste manuscrite.

La liste manuscrite comporte d'autres localités qui attendent une relecture des noms et une définition géographique avant activation.

## Limites critiques
La sélection de zone ne prouve pas qu'une adresse est desservie. Aucun géocodage, aucune validation d'adresse, aucun créneau réel ni commande active. Le nombre de plats est calculé depuis le panier local de démonstration, qui n'est pas contrôlé par le serveur et ne contient aucun produit réel. Les horaires sont les horaires locaux du restaurant ; les fonctions prennent explicitement le jour de semaine et l'heure locale, sans conversion de fuseau. Le panier partagé est conservé uniquement dans le stockage local du navigateur ; son comptage et son éligibilité restent une simulation, car les produits, catégories, tailles et prix ne sont pas encore chargés depuis une source serveur fiable.

**Avant activation du checkout :** associer les produits aux plats principaux, recalculer le panier côté serveur, vérifier l'adresse/zone avec une source fiable et des règles approuvées, appliquer les horaires et les capacités de production, réserver des créneaux, gérer les précommandes et le fuseau Europe/Brussels. Ne pas utiliser la sélection client comme preuve d'éligibilité.
