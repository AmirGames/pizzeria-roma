const menuId = 'menu-20261014';
const size = (productSlug, slug, label, priceCents) => ({ id: `${menuId}-size-${productSlug}-${slug}`, label, priceCents, active: true });
const extra = (slug, nameFr) => ({ id: `${menuId}-extra-${slug}`, nameFr, nameEn: nameFr, priceCents: 250, active: true });
const pastaExtras = [extra('parmesan', 'Parmesan'), extra('gruyere', 'Gruyère')];

const pizzaIngredients = {
  margherita: ['Tomates', 'Mozzarella'],
  salami: ['Tomates', 'Mozzarella', 'Salami ou chorizo'],
  chorizo: ['Tomates', 'Mozzarella', 'Salami ou chorizo'],
  napoli: ['Tomates', 'Mozzarella', 'Câpres', 'Anchois'],
  prosciutto: ['Tomates', 'Mozzarella', 'Jambon'],
  funghi: ['Tomates', 'Mozzarella', 'Champignons'],
  bolognese: ['Bolognaise', 'Mozzarella'],
  'sole-mio': ['Tomates', 'Mozzarella', 'Jambon', 'Œufs'],
  hawai: ['Tomates', 'Mozzarella', 'Jambon', 'Ananas'],
  regina: ['Tomates', 'Mozzarella', 'Jambon', 'Champignons'],
  chevre: ['Tomates', 'Mozzarella', 'Fromage de chèvre', 'Miel'],
  viennese: ['Tomates', 'Mozzarella', 'Saucisses viennoises', 'Oignons'],
  calzone: ['Tomates', 'Mozzarella', 'Jambon', 'Champignons', 'Œufs', 'Ail'],
  capricciosa: ['Tomates', 'Mozzarella', 'Jambon', 'Champignons', 'Olives', 'Anchois'],
  '4-stagioni': ['Tomates', 'Mozzarella', 'Jambon', 'Champignons', 'Salami', 'Artichauts'],
  '4-formaggi': ['Tomates', 'Mozzarella', 'Bel Paese', 'Gorgonzola', 'Taleggio'],
  'al-capone': ['Tomates', 'Mozzarella', 'Jambon', 'Poivrons', 'Œufs durs', 'Ail', 'Anchois'],
  ortolana: ['Tomates', 'Mozzarella', 'Aubergines', 'Oignons', 'Parmesan'],
  brocoli: ['Tomates', 'Mozzarella', 'Brocolis', 'Lardons', 'Oignons', 'Ail'],
  roma: ['Tomates', 'Mozzarella', 'Jambon', 'Salami', 'Œufs', 'Oignons'],
  colosseo: ['Tomates', 'Mozzarella', 'Jambon', 'Épinards', 'Oignons'],
  vegetarienne: ['Tomates', 'Mozzarella', 'Champignons', 'Artichauts', 'Poivrons', 'Olives', 'Oignons'],
  maria: ['Crème', 'Mozzarella', '4 fromages', 'Oignons', 'Anchois'],
  forestiere: ['Tomates', 'Mozzarella', 'Champignons', 'Lardons', 'Oignons', 'Ail'],
  merguez: ['Tomates', 'Mozzarella', 'Poivrons', 'Merguez'],
  'hamburger-cheese': ['Mozzarella', 'Hamburger', 'Oignons frits', 'Sauce barbecue', 'Cheese'],
  'mamma-mia': ['Tomates fraîches', 'Mozzarella en tranches', 'Basilic', 'Huile de basilic'],
  'san-daniele': ['Tomates', 'Mozzarella', 'Jambon de Parme', '4 fromages'],
  rucola: ['Tomates', 'Mozzarella', 'Jambon de Parme', 'Tomates cerises', 'Roquette', 'Parmesan'],
  exotic: ['Tomates', 'Mozzarella', 'Poulet', 'Maïs', 'Ananas'],
  carpaccio: ['Tomates', 'Mozzarella', 'Huile d’olive', 'Viande de bœuf', 'Parmesan'],
  tartiflette: ['Pommes de terre', 'Mozzarella', 'Crème', 'Lardons', 'Oignons', 'Reblochon'],
  thai: ['Tomates', 'Mozzarella', 'Poulet', 'Poivrons', 'Oignons frits', 'Sauce sucrée piquante'],
  'al-tonno': ['Tomates', 'Mozzarella', 'Thon', 'Oignons', 'Ail'],
  salmone: ['Tomates', 'Mozzarella', 'Saumon', 'Ail'],
  'frutti-di-mare': ['Tomates', 'Mozzarella', 'Cocktail de fruits de mer', 'Ail'],
  scampi: ['Tomates', 'Mozzarella', 'Scampis', 'Ail'],
  'mare-e-monte': ['Tomates', 'Mozzarella', 'Fruits de mer', 'Champignons', 'Ail'],
  royale: ['Tomates', 'Mozzarella', 'Langoustines', 'Scampis', 'Saumon', 'Ail'],
  'burrata-pesto': ['Tomates', 'Mozzarella', 'Parme', 'Burrata', 'Roquette', 'Huile pesto'],
  'burrata-balsamique': ['Tomates', 'Mozzarella', 'Parme', 'Burrata', 'Roquette', 'Crème balsamique'],
  'burrata-truffe': ['Tomates', 'Mozzarella', 'Parme', 'Burrata', 'Roquette', 'Huile de truffe'],
  truffe: ['Crème à la truffe', 'Mozzarella', 'Champignons', 'Pancetta'],
};

const pizzas = [
  ['margherita','Margherita',1000,2250], ['salami','Salami',1150,2550], ['chorizo','Chorizo',1150,2550],
  ['napoli','Napoli',1150,2550], ['prosciutto','Prosciutto',1150,2550], ['funghi','Funghi',1150,2550],
  ['bolognese','Bolognese',1250,2750], ['sole-mio','Sole Mio',1250,2750], ['hawai','Hawaï',1250,2750],
  ['regina','Regina',1250,2750], ['chevre','Chèvre',1250,2750], ['viennese','Viennese',1250,2750],
  ['calzone','Calzone',1400,null], ['capricciosa','Capricciosa',1400,3000], ['4-stagioni','4 Stagioni',1400,3000],
  ['4-formaggi','4 Formaggi',1400,3000], ['al-capone','Al Capone',1400,3000], ['ortolana','Ortolana',1400,3000],
  ['brocoli','Brocoli',1400,3000], ['roma','Roma',1400,3000], ['colosseo','Colosseo',1400,3000],
  ['vegetarienne','Végétarienne',1400,3000], ['maria','Maria',1400,3000], ['forestiere','Forestière',1400,3000],
  ['merguez','Merguez',1500,3200], ['hamburger-cheese','Hamburger Cheese',1500,3200], ['mamma-mia','Mamma Mia',1500,3200],
  ['san-daniele','San Daniele',1500,3200], ['rucola','Rucola',1500,3200], ['exotic','Exotic',1500,3200],
  ['carpaccio','Carpaccio',1500,3200], ['tartiflette','Tartiflette',1500,3200], ['thai','Thaï',1500,3200],
  ['al-tonno','Al Tonno',1600,3400], ['salmone','Salmone',1600,3400], ['frutti-di-mare','Frutti di Mare',1600,3400],
  ['scampi','Scampi',1600,3400], ['mare-e-monte','Mare e Monte',1700,3600], ['royale','Royale',1700,3600],
  ['burrata-pesto','Burrata Pesto',1850,4100], ['burrata-balsamique','Burrata Balsamique',1950,4100],
  ['burrata-truffe','Burrata à l’huile de truffe',1950,4100], ['truffe','Truffe',1950,4100],
].map(([slug, nameFr, price33, price50]) => ({
  id: `${menuId}-pizza-${slug}`, nameFr, nameEn: ({
    hawai: 'Hawaiian', chevre: 'Goat Cheese', viennese: 'Vienna Sausage', '4-stagioni': 'Four Seasons',
    '4-formaggi': 'Four Cheeses', ortolana: 'Garden Vegetables', brocoli: 'Broccoli', vegetarienne: 'Vegetarian',
    forestiere: 'Forestière', 'hamburger-cheese': 'Cheeseburger', rucola: 'Arugula', 'al-tonno': 'Tuna',
    salmone: 'Salmon', 'frutti-di-mare': 'Seafood', 'mare-e-monte': 'Sea and Mountain',
    'burrata-balsamique': 'Burrata Balsamic', 'burrata-truffe': 'Burrata Truffle', truffe: 'Truffle',
  })[slug] ?? nameFr, baseCents: 0, active: true,
  ingredients: pizzaIngredients[slug] ?? [],
  sizes: [size(slug, '33cm', '33 cm', price33), ...(price50 === null ? [] : [size(slug, '50cm', '50 cm', price50)])],
  extras: [],
}));

const pastaRows = [
  ['bolognese','Bolognese',1200,true], ['napoli','Napoli',1200,true], ['jambon-creme','Jambon, crème',1300,true],
  ['tomate-creme','Tomate, crème',1300,true], ['carbonara','Carbonara',1400,true], ['al-forno','Al Forno',1550,true],
  ['tonnata','Tonnata',1550,true], ['scampis','Scampis',1650,true], ['al-salmone','Al Salmone',1650,true],
  ['4-formaggi','4 Formaggi',1450,true], ['ravioles-champignons','Ravioles champignons',1850,false],
  ['strozzapreti','Strozzapreti',1850,false], ['maison','Maison',1450,true], ['pesto','Pesto',1450,true],
  ['primavera','Primavera',1450,true], ['fruits-de-mer','Fruits de mer',1650,true],
  ['tortellini-jambon-creme','Tortellini jambon, crème',1500,false], ['lasagne','Lasagne',1550,false],
  ['cannelloni','Cannelloni',1550,false], ['tortelli','Tortelli',1850,false],
];
const pastaIngredients = {
  scampis: ['Scampis'],
  'al-salmone': ['Saumon'],
  '4-formaggi': ['4 fromages'],
  'jambon-creme': ['Jambon', 'Crème'],
  'tomate-creme': ['Tomate', 'Crème'],
  'al-forno': ['Bolognaise', 'Œufs', 'Jambon', 'Gratiné'],
  tonnata: ['Sauce tomate', 'Olives', 'Thon'],
  'ravioles-champignons': ['Ravioles fraîches farcies aux cèpes', 'Crème à la truffe', 'Roquette', 'Pancetta'],
  strozzapreti: ['Pâtes fraîches', 'Sauce tomate', 'Aubergines', 'Pancetta', 'Ail', 'Parmesan de ricotta salée'],
  maison: ['Sauce tomate', 'Lardons', 'Aubergines', 'Ail'],
  pesto: ['Crème', 'Pesto'],
  primavera: ['Champignons', 'Haricots', 'Choux-fleurs', 'Brocolis', 'Tomate', 'Ail'],
  'fruits-de-mer': ['Fruits de mer'],
  'tortellini-jambon-creme': ['Tortellini', 'Jambon', 'Crème'],
  tortelli: ['Pâtes fraîches farcies à la mozzarella di bufala campana', 'Tomate basilic', 'Pesto genovese', 'Roquette', 'Pignons de pin grillés'],
};
const pastas = pastaRows.map(([slug, nameFr, priceCents, hasShapeChoice]) => ({
  id: `${menuId}-pasta-${slug}`, nameFr, nameEn: ({
    bolognese: 'Bolognese', 'jambon-creme': 'Ham and Cream', 'tomate-creme': 'Tomato and Cream',
    'al-forno': 'Baked Pasta', tonnata: 'Tuna Sauce', scampis: 'Prawns', 'al-salmone': 'Salmon',
    '4-formaggi': 'Four Cheeses', 'ravioles-champignons': 'Mushroom Ravioli', maison: 'House Special',
    'fruits-de-mer': 'Seafood', 'tortellini-jambon-creme': 'Ham and Cream Tortellini', lasagne: 'Lasagna',
  })[slug] ?? nameFr, baseCents: priceCents, active: true,
  ingredients: pastaIngredients[slug] ?? [],
  choiceLabel: hasShapeChoice ? 'Type de pâtes' : null,
  extraSelectionMode: 'SINGLE',
  sizes: hasShapeChoice ? [
    size(slug, 'spaghetti', 'Spaghetti', priceCents),
    size(slug, 'macaroni', 'Macaroni', priceCents),
    size(slug, 'tagliatelle', 'Tagliatelle', priceCents + 100),
  ] : [],
  extras: pastaExtras.map(item => ({ ...item, id: `${item.id}-${slug}` })),
}));

const product = (category, slug, nameFr, nameEn, baseCents, options = {}) => ({
  id: `${menuId}-${category}-${slug}`, nameFr, nameEn, baseCents, active: true, sizes: [], extras: [], ...options,
});
const sides = [
  product('side','pain','Pain (6 pièces)','Bread (6 pieces)',300),
  product('side','pain-ail','Pain à l’ail (6 pièces)','Garlic bread (6 pieces)',650),
  product('side','pain-lardons','Pain aux lardons (6 pièces)','Bacon bread (6 pieces)',750),
  product('side','pain-anchois','Pain aux anchois (6 pièces)','Anchovy bread (6 pieces)',750),
];
const salads = [
  ['caprese','Caprese',1200], ['italienne','Italienne',1500], ['meridionale','Méridionale',1250],
  ['adriatica','Adriatica',1450], ['tricolore','Tricolore',1400], ['salade-de-pates','Salade de pâtes',1500],
  ['roma','Roma',1550], ['septentrionale','Septentrionale',1650], ['hawaienne','Hawaïenne',1450],
  ['burrata','Burrata',1750],
].map(([slug, nameFr, price]) => product('salad',slug,`Salade ${nameFr}`,`${({ italienne: 'Italian', meridionale: 'Southern Italian', adriatica: 'Adriatic', tricolore: 'Three-Colour', septentrionale: 'Northern Italian', hawaienne: 'Hawaiian', 'salade-de-pates': 'Pasta' })[slug] ?? nameFr} salad`,price));
const meat = [product('meat','ossobuco','Ossobuco','Ossobuco',2700)];
const drinks = [
  product('drink','coca','Coca 33 cl','Coca-Cola 33 cl',250),
  product('drink','coca-light','Coca Light 33 cl','Coca Light 33 cl',250),
  product('drink','coca-zero','Coca Zero 33 cl','Coca Zero 33 cl',250),
  product('drink','fanta','Fanta 33 cl','Fanta 33 cl',250),
  product('drink','jupiler','Jupiler 33 cl','Jupiler 33 cl',300),
  product('drink','vin-rouge','Vin rouge 75 cl','Red wine 75 cl',1800),
  product('drink','vin-rose','Vin rosé 75 cl','Rosé wine 75 cl',1800),
  product('drink','vin-blanc','Vin blanc 75 cl','White wine 75 cl',1800),
];
const desserts = [
  product('dessert','tiramisu-profiteroles','Tiramisù ou profiteroles','Tiramisu or profiteroles',500,{
    choiceLabel:'Choix', sizes:[size('tiramisu-profiteroles','tiramisu','Tiramisù',500),size('tiramisu-profiteroles','profiteroles','Profiteroles',500)],
  }),
  product('dessert','mousse-chocolat','Mousse au chocolat','Chocolate mousse',500),
];

export const menu20261014 = [
  { id:`${menuId}-cat-pizzas`, nameFr:'Pizzas', nameEn:'Pizzas', fulfillmentCategory:'PIZZA', position:10, products:pizzas },
  { id:`${menuId}-cat-pates`, nameFr:'Pâtes', nameEn:'Pasta', fulfillmentCategory:'PASTA', position:20, products:pastas },
  { id:`${menuId}-cat-accompagnements`, nameFr:'Accompagnements', nameEn:'Sides', fulfillmentCategory:'OTHER', position:30, products:sides },
  { id:`${menuId}-cat-salades`, nameFr:'Salades', nameEn:'Salads', fulfillmentCategory:'OTHER', position:40, products:salads },
  { id:`${menuId}-cat-viande`, nameFr:'Viande', nameEn:'Meat', fulfillmentCategory:'OTHER', position:50, products:meat },
  { id:`${menuId}-cat-boissons`, nameFr:'Boissons', nameEn:'Drinks', fulfillmentCategory:'OTHER', position:60, products:drinks },
  { id:`${menuId}-cat-desserts`, nameFr:'Desserts', nameEn:'Desserts', fulfillmentCategory:'OTHER', position:70, products:desserts },
];

export const ingredientsCatalog = [...new Set([...Object.values(pizzaIngredients).flat(), ...Object.values(pastaIngredients).flat()])].sort((a, b) => a.localeCompare(b, 'fr'));
export const pizzaSupplementNames = new Set(Object.values(pizzaIngredients).flat());
