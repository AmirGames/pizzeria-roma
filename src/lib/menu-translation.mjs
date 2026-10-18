const en = new Map(Object.entries({
  tomates: 'Tomatoes', tomate: 'Tomato', mozzarella: 'Mozzarella', 'salami ou chorizo': 'Salami or chorizo',
  câpres: 'Capers', anchois: 'Anchovies', jambon: 'Ham', champignons: 'Mushrooms', bolognaise: 'Bolognese sauce',
  'œufs': 'Eggs', oeufs: 'Eggs', ananas: 'Pineapple', 'fromage de chèvre': 'Goat cheese', miel: 'Honey',
  'saucisses viennoises': 'Vienna sausages', oignons: 'Onions', ail: 'Garlic', olives: 'Olives', artichauts: 'Artichokes',
  'bel paese': 'Bel Paese cheese', gorgonzola: 'Gorgonzola', taleggio: 'Taleggio', aubergines: 'Aubergines',
  parmesan: 'Parmesan', fromage: 'Cheese', brocolis: 'Broccoli', brocoli: 'Broccoli', lardons: 'Bacon', épinards: 'Spinach', epinards: 'Spinach',
  poivrons: 'Peppers', merguez: 'Merguez sausage', hamburger: 'Beef burger', 'oignons frits': 'Crispy onions',
  'sauce barbecue': 'Barbecue sauce', cheese: 'Cheese', 'tomates fraîches': 'Fresh tomatoes', 'mozzarella en tranches': 'Sliced mozzarella',
  basilic: 'Basil', 'huile de basilic': 'Basil oil', 'jambon de parme': 'Parma ham', 'tomates cerises': 'Cherry tomatoes',
  roquette: 'Rocket', poulet: 'Chicken', maïs: 'Sweetcorn', 'huile d’olive': 'Olive oil', 'huile d\'olive': 'Olive oil',
  'viande de bœuf': 'Beef', 'viande de boeuf': 'Beef', 'pommes de terre': 'Potatoes', crème: 'Cream', reblochon: 'Reblochon cheese',
  'sauce sucrée piquante': 'Sweet chilli sauce', thon: 'Tuna', saumon: 'Salmon', 'cocktail de fruits de mer': 'Seafood mix',
  scampis: 'Prawns', 'fruits de mer': 'Seafood', langoustines: 'Langoustines', parme: 'Parma ham', burrata: 'Burrata',
  'huile pesto': 'Pesto oil', 'crème balsamique': 'Balsamic glaze', 'huile de truffe': 'Truffle oil', 'crème à la truffe': 'Truffle cream',
  pancetta: 'Pancetta', '4 fromages': 'Four cheeses', 'sauce tomate': 'Tomato sauce', 'ravioles fraîches farcies aux cèpes': 'Fresh porcini ravioli',
  'pâtes fraîches': 'Fresh pasta', 'parmesan de ricotta salée': 'Salted ricotta', 'tomate basilic': 'Tomato and basil',
  'pesto genovese': 'Genovese pesto', 'pignons de pin grillés': 'Toasted pine nuts', haricots: 'Green beans', 'choux-fleurs': 'Cauliflower',
  'pâtes fraîches farcies à la mozzarella di bufala campana': 'Fresh pasta filled with mozzarella di bufala campana',
  'tortellini': 'Tortellini', gratiné: 'Gratinated',
  'gruyère': 'Gruyère', 'pain': 'Bread', 'parmesan': 'Parmesan', 'sans': 'Without',
  'œufs durs': 'Hard-boiled eggs', 'forestière': 'Woodland', 'type de pâtes': 'Pasta shape',
  caprese: 'Caprese', italienne: 'Italian', méridionale: 'Southern Italian', meridionale: 'Southern Italian',
  adriatica: 'Adriatic', tricolore: 'Three-colour', septentrionale: 'Northern Italian', hawaïenne: 'Hawaiian',
  'salade de pâtes': 'Pasta salad', 'salade caprese': 'Caprese salad', 'salade italienne': 'Italian salad',
  'salade méridionale': 'Southern Italian salad', 'salade meridionale': 'Southern Italian salad',
  'salade adriatica': 'Adriatic salad', 'salade tricolore': 'Three-colour salad',
  'salade septentrionale': 'Northern Italian salad', 'salade hawaïenne': 'Hawaiian salad',
  'salade hawaienne': 'Hawaiian salad',
  accompagnements: 'Sides', viande: 'Meat', salades: 'Salads', pâtes: 'Pasta', boissons: 'Drinks',
  choix: 'Choice',
  'végétarienne': 'Vegetarian', 'hawaï': 'Hawaiian', 'chèvre': 'Goat cheese',
  'hamburger cheese': 'Cheeseburger',
  'jambon, crème': 'Ham and cream', 'tomate, crème': 'Tomato and cream',
  'ravioles champignons': 'Mushroom ravioli', 'tortellini jambon, crème': 'Ham and cream tortellini',
  'pain à l’ail (6 pièces)': 'Garlic bread (6 pieces)', 'pain aux lardons (6 pièces)': 'Bacon bread (6 pieces)',
  'pain aux anchois (6 pièces)': 'Anchovy bread (6 pieces)', 'tiramisu ou profiteroles': 'Tiramisu or profiteroles',
  'mousse au chocolat': 'Chocolate mousse', 'vin rouge 75 cl': 'Red wine 75 cl', 'vin rosé 75 cl': 'Rosé wine 75 cl',
  'vin blanc 75 cl': 'White wine 75 cl', 'coca 33 cl': 'Coca-Cola 33 cl', 'coca zero 33 cl': 'Coca-Cola Zero 33 cl',
  'coca light 33 cl': 'Coca-Cola Light 33 cl', 'burrata à l’huile de truffe': 'Burrata with truffle oil',
  'salade roma': 'Roma salad', 'salade burrata': 'Burrata salad',
  'namur centre': 'Namur city centre',
  'pain (6 pièces)': 'Bread (6 pieces)',
  'al salmone': 'Salmon', 'al tonno': 'Tuna', 'mare e monte': 'Sea and mountain',
  'burrata balsamique': 'Burrata with balsamic glaze', 'burrata pesto': 'Burrata with pesto',
}));

export function englishMenuTerm(value) {
  if (typeof value !== 'string') return value;
  return en.get(value.trim().toLocaleLowerCase('fr-BE')) ?? value;
}

export function englishIngredientList(values) {
  return Array.isArray(values) ? values.map(englishMenuTerm) : [];
}
