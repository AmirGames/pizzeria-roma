# Personnalisation des pizzas

Le menu propose des pizzas prédéfinies : format, retrait d'ingrédients configurés et suppléments actifs avec prix actualisé. Les retraits ne réduisent jamais le prix. Le panier distingue les recettes et affiche « Sans … » et « Supplément … ».

## Configuration

Appliquer la migration `20261015070000_pizza_removals` sur la base cible après revue, puis régénérer le client Prisma. `Product.removableIngredients` contient les libellés exacts des ingrédients retirables de cette recette, par exemple `["Tomate", "Mozzarella"]`. Le serveur valide chaque retrait contre cette liste. Elle est vide par défaut : aucune composition n'est déduite du nom d'une pizza. Le seed existant préserve cette configuration.

Les suppléments utilisent les `ProductExtra` actifs du produit et leurs tarifs en centimes. `ProductExtra.sizePrices` permet un tarif en centimes par identifiant de format. Si ce champ est nul, le tarif fixe existant s’applique. Si une grille est définie, un format absent rend le supplément indisponible pour ce format. La même grille est utilisée dans le menu et côté serveur.

La composition des 43 pizzas et les tarifs individuels des suppléments n'ont pas encore été fournis. Ces données peuvent être renseignées dans `/gerant/carte` et restent à confirmer ; aucun tarif ou ingrédient n'est inventé. Les options non configurées sont signalées dans le menu.

## Contrôles

Le navigateur conserve uniquement les identifiants, retraits et quantités. Le serveur relit les tarifs et valide les retraits, les suppléments et le format. Les retraits inconnus, dupliqués ou demandés pour un autre type de plat sont rejetés. Les anciens paniers restent compatibles.

Le catalogue public transmet désormais le statut actif des options au filtre de publication, permettant aux tailles et suppléments actifs d'être affichés.

Les tests couvrent le prix inchangé après retrait, le cumul des suppléments, le refus des retraits invalides, la conservation dans le stockage et la séparation des recettes. Aucune commande réelle ni paiement n'est activé. Les allergènes et la politique moitié-moitié restent à confirmer.

Voir [l’espace gérant](MANAGER.md) pour la configuration et l’accès privé.
