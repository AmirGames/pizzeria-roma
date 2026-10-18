import type { SiteLocale } from '../lib/locale';

/** Shared interface messages. Page-specific copy is added here as pages move to the catalog. */
type MessageCatalog = {
  header: {
    homeLabel: string;
    navigationLabel: string;
    home: string;
    menu: string;
    delivery: string;
    story: string;
    contact: string;
    account: string;
    testOrder: string;
    cart: (count: number) => string;
    language: string;
  };
  footer: {
    navigationLabel: string;
    tagline: string;
    hours: string;
    hoursLine: string;
    saturday: string;
    findUs: string;
    quickLinks: string;
    about: string;
    menu: string;
    addressHours: string;
    deliveryCollection: string;
    cart: string;
    closing: string;
  };
  menu: {
    title: string;
    intro: string;
    itemsLabel: string;
    noticeEmpty: string;
    noticeOpen: string;
    noticeSetup: string;
  };
  catalog: {
    cartLimit: string;
    emptyCatalog: string;
    categoriesLabel: string;
    dishesFallback: string;
    categoryTitle: (name: string) => string;
    searchPlaceholder: string;
    searchLabel: string;
    noSearchResults: string;
    dessert: string;
    choose: string;
    or: string;
    sizes: string;
    àLaCarte: string;
    customize: string;
    closeOptions: string;
    add: string;
    added: string;
  };
  cart: {
    eyebrow: string;
    title: string;
    realIntro: string;
    testIntro: string;
    itemsLabel: string;
    emptyTitle: string;
    emptyText: string;
    browseMenu: string;
    checkingPrices: string;
    verificationError: string;
    itemToVerify: string;
    quantity: string;
    editOptions: string;
    remove: string;
    extra: string;
    without: string;
    menuItem: string;
    editOptionsFor: (name: string) => string;
    quantityFor: (name: string) => string;
    decrease: string;
    increase: string;
    removeItem: (name: string) => string;
    summaryLabel: string;
    verifiedSummary: string;
    subtotal: string;
    loyalty: string;
    promotion: string;
    delivery: string;
    deliveryLater: string;
    total: string;
    continueTitle: string;
    accountLink: string;
    guestLink: string;
    accountOrGuest: string;
    guestTestNotice: string;
    serverPrices: string;
    maxQuantity: string;
  };
  cartEditor: {
    title: string;
    appliesTo: (count: number) => string;
    unavailable: string;
    loading: string;
    save: string;
    cancel: string;
    loadError: string;
    validateError: string;
    changedError: string;
    saveError: string;
  };
};

const messages = {
  fr: {
    header: {
      homeLabel: 'Pizzeria Roma, accueil',
      navigationLabel: 'Navigation principale',
      home: 'Accueil',
      menu: 'Notre carte',
      delivery: 'Livraison',
      story: 'À propos',
      contact: 'Contact',
      account: 'Connexion et espace client',
      testOrder: 'Commander en mode test',
      cart: (count: number) => `Panier, ${count} article${count === 1 ? '' : 's'}`,
      language: 'Langue du site',
    },
    footer: {
      navigationLabel: 'Liens de pied de page',
      tagline: 'Les saveurs italiennes à Namur.',
      hours: 'Horaires',
      hoursLine: '11h30–14h · 18h–22h',
      saturday: 'Samedi : 18h00–22h00',
      findUs: 'Nous trouver',
      quickLinks: 'En un clic',
      menu: 'Notre carte',
      about: 'À propos de Pizzeria Roma',
      addressHours: 'Adresse et horaires',
      deliveryCollection: 'Livraison & retrait',
      cart: 'Mon panier',
      closing: 'Fait avec passion en Italie, servi à Namur',
    },
    menu: {
      title: 'Notre carte',
      intro: 'Découvrez nos pizzas, pâtes, salades et spécialités italiennes.',
      itemsLabel: 'Carte des plats',
      noticeEmpty: 'La carte est en cours de préparation. Pour les allergènes, contactez le restaurant.',
      noticeOpen: 'Carte publiée et commandes en ligne disponibles. Les informations sur les allergènes sont disponibles auprès du restaurant.',
      noticeSetup: 'Carte publiée. Les commandes en ligne et le paiement sécurisé seront disponibles après la configuration finale. Pour les allergènes, contactez le restaurant.',
    },
    catalog: {
      cartLimit: 'Le panier est complet ou la quantité maximale a été atteinte.',
      emptyCatalog: 'Les plats et tarifs seront affichés après validation et publication de la carte.',
      categoriesLabel: 'Catégories du menu',
      dishesFallback: 'plats',
      categoryTitle: name => `Nos ${name.toLocaleLowerCase('fr-BE')}`,
      searchPlaceholder: 'Rechercher une pizza…',
      searchLabel: 'Rechercher une pizza',
      noSearchResults: 'Aucun article ne correspond à votre recherche dans cette catégorie.',
      dessert: 'Dessert',
      choose: 'Choisissez',
      or: 'ou',
      sizes: 'Formats',
      àLaCarte: 'À la carte',
      customize: 'Personnaliser',
      closeOptions: 'Fermer les options',
      add: 'Ajouter',
      added: 'Ajouté au panier ✓',
    },
    cart: {
      eyebrow: 'VOTRE SÉLECTION',
      title: 'Votre panier',
      realIntro: 'Articles et prix recalculés par le serveur avant le paiement sécurisé.',
      testIntro: 'Prix et articles relus depuis la carte du restaurant. Aucune commande n’est envoyée.',
      itemsLabel: 'Articles du panier',
      emptyTitle: 'Votre panier est vide',
      emptyText: 'Choisissez un article depuis la carte.',
      browseMenu: 'Explorer la carte →',
      checkingPrices: 'Vérification des prix depuis la carte…',
      verificationError: 'Impossible de vérifier une sélection. Modifiez les articles concernés, retirez-les ou réessayez plus tard.',
      itemToVerify: 'Article à vérifier',
      quantity: 'Quantité',
      editOptions: 'Modifier les options',
      remove: 'Retirer',
      extra: 'Supplément',
      without: 'Sans',
      menuItem: 'Article du menu',
      editOptionsFor: name => `Modifier les options de ${name}`,
      quantityFor: name => `Quantité pour ${name}`,
      decrease: 'Diminuer la quantité',
      increase: 'Augmenter la quantité',
      removeItem: name => `Supprimer ${name}`,
      summaryLabel: 'Récapitulatif du panier',
      verifiedSummary: 'Récapitulatif vérifié',
      subtotal: 'Sous-total',
      loyalty: 'Carte fidélité — plat offert',
      promotion: 'Promotion',
      delivery: 'Livraison',
      deliveryLater: 'À calculer selon le mode choisi',
      total: 'Total',
      continueTitle: 'Comment souhaitez-vous continuer ?',
      accountLink: 'Créer un compte ou se connecter →',
      guestLink: 'Continuer en invité →',
      accountOrGuest: 'Choisissez de créer un compte, de vous connecter ou de continuer en invité.',
      guestTestNotice: 'En invité, vous pouvez consulter les options de livraison et de retrait. Les commandes réelles ne sont pas encore ouvertes ; les commandes de test nécessitent un compte client.',
      serverPrices: 'Les prix et le sous-total proviennent du serveur. Ce récapitulatif ne crée ni commande ni paiement.',
      maxQuantity: 'Quantité maximale atteinte : 99 exemplaires par recette.',
    },
    cartEditor: {
      title: 'Modifier la recette',
      appliesTo: count => `La modification s’applique aux ${count} exemplaire(s) de cette ligne.`,
      unavailable: 'Cet article n’est plus disponible sur la carte. Vous pouvez le supprimer du panier.',
      loading: 'Chargement des options…',
      save: 'Enregistrer la recette',
      cancel: 'Annuler',
      loadError: 'Impossible de charger les options. Fermez puis réessayez.',
      validateError: 'La sélection ne peut pas être validée. La carte a peut-être changé : fermez puis réouvrez la modification.',
      changedError: 'Le panier a changé pendant la modification. Fermez puis réessayez.',
      saveError: 'Impossible d’enregistrer cette recette. Vérifiez la connexion ou la quantité totale (99 maximum).',
    },
  },
  en: {
    header: {
      homeLabel: 'Pizzeria Roma, home',
      navigationLabel: 'Main navigation',
      home: 'Home',
      menu: 'Our menu',
      delivery: 'Delivery',
      story: 'Our story',
      contact: 'Contact',
      account: 'Customer account',
      testOrder: 'Test order',
      cart: (count: number) => `Cart, ${count} item${count === 1 ? '' : 's'}`,
      language: 'Site language',
    },
    footer: {
      navigationLabel: 'Footer links',
      tagline: 'Italian flavours in Namur.',
      hours: 'Opening hours',
      hoursLine: '11:30 am–2:00 pm · 6:00–10:00 pm',
      saturday: 'Saturday: 6:00–10:00 pm',
      findUs: 'Find us',
      quickLinks: 'Quick links',
      menu: 'Our menu',
      about: 'About Pizzeria Roma',
      addressHours: 'Address and opening hours',
      deliveryCollection: 'Delivery & collection',
      cart: 'My cart',
      closing: 'Made with passion in Italy, served in Namur',
    },
    menu: {
      title: 'Our menu',
      intro: 'Discover our pizzas, pasta, salads and Italian specialities.',
      itemsLabel: 'Menu items',
      noticeEmpty: 'Our menu is being prepared. Please contact the restaurant about allergens.',
      noticeOpen: 'Menu published and online ordering available. Please ask the restaurant about allergens.',
      noticeSetup: 'Menu published. Online ordering and secure payment will be available after final setup. Please contact us about allergens.',
    },
    catalog: {
      cartLimit: 'Your cart is full or the maximum quantity has been reached.',
      emptyCatalog: 'Menu items and prices will appear once the menu is approved and published.',
      categoriesLabel: 'Menu categories',
      dishesFallback: 'Dishes',
      categoryTitle: name => `Our ${name}`,
      searchPlaceholder: 'Search the menu…',
      searchLabel: 'Search the menu',
      noSearchResults: 'No items in this category match your search.',
      dessert: 'Dessert',
      choose: 'Choose',
      or: 'or',
      sizes: 'Sizes',
      àLaCarte: 'À la carte',
      customize: 'Customize',
      closeOptions: 'Close options',
      add: 'Add',
      added: 'Added to cart ✓',
    },
    cart: {
      eyebrow: 'YOUR SELECTION',
      title: 'Your cart',
      realIntro: 'Items and prices are recalculated by the server before secure payment.',
      testIntro: 'Items and prices are checked against the restaurant menu. No order is submitted.',
      itemsLabel: 'Cart items',
      emptyTitle: 'Your cart is empty',
      emptyText: 'Choose an item from the menu.',
      browseMenu: 'Browse the menu →',
      checkingPrices: 'Checking menu prices…',
      verificationError: 'We could not verify your selection. Edit or remove the affected items, or try again later.',
      itemToVerify: 'Item to verify',
      quantity: 'Quantity',
      editOptions: 'Edit options',
      remove: 'Remove',
      extra: 'Extra',
      without: 'No',
      menuItem: 'Menu item',
      editOptionsFor: name => `Edit options for ${name}`,
      quantityFor: name => `Quantity for ${name}`,
      decrease: 'Decrease quantity',
      increase: 'Increase quantity',
      removeItem: name => `Remove ${name}`,
      summaryLabel: 'Cart summary',
      verifiedSummary: 'Verified summary',
      subtotal: 'Subtotal',
      loyalty: 'Loyalty card — free item',
      promotion: 'Promotion',
      delivery: 'Delivery',
      deliveryLater: 'Calculated at the next step',
      total: 'Total',
      continueTitle: 'How would you like to continue?',
      accountLink: 'Create an account or sign in →',
      guestLink: 'Continue as guest →',
      accountOrGuest: 'Create an account, sign in, or continue as a guest.',
      guestTestNotice: 'You can review delivery and collection options as a guest. Real orders are not open yet. Test orders require a customer account.',
      serverPrices: 'Prices and subtotal come from the server. This summary does not create an order or payment.',
      maxQuantity: 'Maximum quantity reached: 99 of each recipe.',
    },
    cartEditor: {
      title: 'Edit recipe',
      appliesTo: count => `Changes apply to all ${count} item(s) in this line.`,
      unavailable: 'This item is no longer on the menu. You can remove it from your cart.',
      loading: 'Loading options…',
      save: 'Save recipe',
      cancel: 'Cancel',
      loadError: 'Could not load the options. Close this editor and try again.',
      validateError: 'This selection could not be validated. The menu may have changed: close and reopen the editor.',
      changedError: 'The cart changed while you were editing. Close and try again.',
      saveError: 'Could not save this recipe. Check your connection or the total quantity (maximum 99).',
    },
  },
} satisfies Record<SiteLocale, MessageCatalog>;

export function getMessages(locale: SiteLocale) {
  return messages[locale];
}
