// File Path: /server/seedTamilNaduRecipes.ts
import { runSql, querySqlAll } from "./models/db";

export const TOP_BAKERY_CAKES_RECIPES = [
  // --- FAMOUS BAKERY CAKES ---
  {
    id: "bakery-01-honey-cake",
    name: "Iyengar Bakery Honey Cake",
    category: "Cakes",
    stdYield: 1,
    yieldUnit: "kg (approx 12 cake slices)",
    ingredients: [
      { name: "All Purpose Flour (Maida)", qty: 250 },
      { name: "Caster Sugar", qty: 250 },
      { name: "Unsalted Butter", qty: 250 },
      { name: "Whole Eggs", qty: 250 },
      { name: "Baking Powder", qty: 8 },
      { name: "Honey Syrup (Pure Honey + Warm Water)", qty: 200 },
      { name: "Mixed Fruit Jam Glaze", qty: 150 },
      { name: "Desiccated Coconut Powder", qty: 60 }
    ],
    instructions: [
      { stepNumber: 1, text: "Preheat oven to 175°C (350°F) and line a 9x13 inch rectangular baking pan." },
      { stepNumber: 2, text: "Cream butter and sugar until pale and fluffy. Add eggs one at a time." },
      { stepNumber: 3, text: "Fold in sifted flour and baking powder to form smooth batter. Bake for 30 minutes until golden." },
      { stepNumber: 4, text: "Poke holes over warm sponge cake with toothpick. Pour warm honey syrup evenly over cake." },
      { stepNumber: 5, text: "Spread warm fruit jam glaze over top and dust generously with desiccated coconut. Slice into squares." }
    ],
    prepTimeMinutes: 20,
    cookTimeMinutes: 30,
    slug: "iyengar-bakery-honey-cake-calculator",
    metaTitle: "Iyengar Bakery Honey Cake Recipe & Batch Scaler | Bakery Calculator",
    metaDescription: "Calculate exact sponge, honey syrup, jam glaze, and coconut ratios for famous Iyengar bakery honey cake.",
    keywords: "honey cake recipe, iyengar bakery honey cake calculator, bakery sponge cake scale"
  },
  {
    id: "bakery-02-plum-cake",
    name: "Rich Christmas Plum Fruit Cake",
    category: "Cakes",
    stdYield: 1,
    yieldUnit: "kg",
    ingredients: [
      { name: "All Purpose Flour (Maida)", qty: 250 },
      { name: "Dark Brown Sugar / Caramel Syrup", qty: 250 },
      { name: "Unsalted Butter", qty: 250 },
      { name: "Eggs", qty: 250 },
      { name: "Soaked Dried Fruits (Raisins, Sultanas, Candied Peel, Tutti Frutti)", qty: 400 },
      { name: "Warm Spice Mix (Cinnamon, Clove, Nutmeg, Cardamom)", qty: 10 },
      { name: "Orange Juice / Rum Soaking Syrup", qty: 100 }
    ],
    instructions: [
      { stepNumber: 1, text: "Soak chopped dry fruits in orange juice/rum for 48 hours." },
      { stepNumber: 2, text: "Prepare dark caramel syrup by heating sugar until deep brown, then add warm water." },
      { stepNumber: 3, text: "Cream butter and dark brown sugar. Beat in eggs and spice mix." },
      { stepNumber: 4, text: "Fold in flour, soaked fruit mixture, and caramel syrup." },
      { stepNumber: 5, text: "Bake at 150°C (300°F) for 60-70 minutes until toothpick comes out clean." }
    ],
    prepTimeMinutes: 30,
    cookTimeMinutes: 70,
    slug: "rich-christmas-plum-cake-calculator",
    metaTitle: "Rich Christmas Plum Fruit Cake Recipe & Fruit Scaler | Floura",
    metaDescription: "Calculate exact soaked dry fruit, caramel syrup, and flour ratios for bakery style Christmas plum cake.",
    keywords: "plum cake recipe, christmas fruit cake calculator, plum cake batch scaling"
  },
  {
    id: "bakery-03-dilkush",
    name: "Iyengar Bakery Dilkush / Dilpasand",
    category: "Pastries",
    stdYield: 4,
    yieldUnit: "large dilkush rounds",
    ingredients: [
      { name: "Maida (Flour)", qty: 300 },
      { name: "Yeast", qty: 7 },
      { name: "Butter", qty: 50 },
      { name: "Tutti Frutti", qty: 150 },
      { name: "Grated Fresh Coconut", qty: 150 },
      { name: "Sugar & Cardamom Powder", qty: 100 },
      { name: "Chopped Nuts & Raisins", qty: 50 }
    ],
    instructions: [
      { stepNumber: 1, text: "Knead maida, yeast, milk, and butter into soft dough. Rest 1 hour until doubled." },
      { stepNumber: 2, text: "Mix tutti frutti, coconut, sugar, nuts, and cardamom into sweet filling." },
      { stepNumber: 3, text: "Roll two round dough discs. Place sweet filling in center and seal edges neatly." },
      { stepNumber: 4, text: "Brush with milk/butter and bake at 180°C (350°F) for 25 minutes until golden brown." }
    ],
    prepTimeMinutes: 75,
    cookTimeMinutes: 25,
    slug: "iyengar-bakery-dilpasand-dilkush-calculator",
    metaTitle: "Iyengar Bakery Dilkush Dilpasand Recipe & Filling Scaler",
    metaDescription: "Scale tutti frutti coconut filling and bread dough for traditional bakery Dilkush / Dilpasand.",
    keywords: "dilkush recipe, dilpasand calculator, iyengar bakery sweet bread"
  },
  {
    id: "bakery-04-thoothukudi-macaroons",
    name: "Thoothukudi Cashew Macaroons",
    category: "Cookies",
    stdYield: 30,
    yieldUnit: "macaroons",
    ingredients: [
      { name: "Egg Whites", qty: 150 },
      { name: "Powdered Sugar (Icing Sugar)", qty: 300 },
      { name: "Chopped Raw Cashew Nuts", qty: 250 },
      { name: "Vanilla Extract", qty: 5 }
    ],
    instructions: [
      { stepNumber: 1, text: "Whip egg whites to stiff glossy peaks using clean electric mixer." },
      { stepNumber: 2, text: "Sift in powdered sugar 1 tbsp at a time while continuing to whip to stiff meringue." },
      { stepNumber: 3, text: "Gently fold in chopped cashews and vanilla using rubber spatula." },
      { stepNumber: 4, text: "Pipe cone-shaped peaks on parchment paper lined baking trays." },
      { stepNumber: 5, text: "Slow bake at 100°C (210°F) for 2 hours until crisp, light, and airy." }
    ],
    prepTimeMinutes: 20,
    cookTimeMinutes: 120,
    slug: "thoothukudi-cashew-macaroons-calculator",
    metaTitle: "Thoothukudi Cashew Macaroons Recipe & Meringue Scaler",
    metaDescription: "Calculate egg white meringue, powdered sugar, and cashew ratios for legendary Tuticorin Macaroons.",
    keywords: "thoothukudi macaroons recipe, tuticorin macaroon calculator, cashew meringue scale"
  },
  {
    id: "bakery-05-black-forest-cake",
    name: "Bakery Style Black Forest Cake",
    category: "Cakes",
    stdYield: 1,
    yieldUnit: "kg (2-tier 8-inch cake)",
    ingredients: [
      { name: "Chocolate Sponge Cake (Flour, Cocoa, Eggs, Sugar)", qty: 500 },
      { name: "Whipped Cream", qty: 400 },
      { name: "Kirsch / Cherry Sugar Syrup", qty: 100 },
      { name: "Pitted Red Cherries (Chopped)", qty: 150 },
      { name: "Dark Chocolate Shavings", qty: 100 }
    ],
    instructions: [
      { stepNumber: 1, text: "Bake dark chocolate sponge cake and slice into 3 horizontal layers." },
      { stepNumber: 2, text: "Drizzle cherry sugar syrup generously over sponge layer." },
      { stepNumber: 3, text: "Spread whipped cream, top with chopped cherries, and stack layers." },
      { stepNumber: 4, text: "Frost entire cake with whipped cream, coat sides with chocolate shavings, and top with cherry rosettes." }
    ],
    prepTimeMinutes: 40,
    cookTimeMinutes: 30,
    slug: "black-forest-cake-recipe-calculator",
    metaTitle: "Bakery Style Black Forest Cake Recipe & Layer Scaler | Floura",
    metaDescription: "Calculate exact chocolate sponge, whipped cream, and cherry filling proportions for 1kg Black Forest cake.",
    keywords: "black forest cake recipe, bakery cake calculator, chocolate sponge whipped cream scale"
  },
  {
    id: "bakery-06-ooty-varkey",
    name: "Authentic Nilgiri Ooty Varkey",
    category: "Pastries",
    stdYield: 500,
    yieldUnit: "grams (approx 20 pieces)",
    ingredients: [
      { name: "Maida (Flour)", qty: 300 },
      { name: "Rava (Sooji)", qty: 50 },
      { name: "Vegetable Fat / Dalda / Butter", qty: 150 },
      { name: "Sugar & Salt", qty: 25 },
      { name: "Water", qty: 120 }
    ],
    instructions: [
      { stepNumber: 1, text: "Knead maida, rava, sugar, salt, and water to stiff dough." },
      { stepNumber: 2, text: "Roll out thin sheet, smear fat, fold into 3-layers, rest 20 mins. Repeat folding 4 times." },
      { stepNumber: 3, text: "Cut into square/diamond shapes and rest." },
      { stepNumber: 4, text: "Bake in wood-fired or deck oven at 200°C for 25 mins until puff-layered and super crispy." }
    ],
    prepTimeMinutes: 60,
    cookTimeMinutes: 25,
    slug: "ooty-varkey-recipe-calculator",
    metaTitle: "Authentic Nilgiri Ooty Varkey Recipe & Puff Layering Calculator",
    metaDescription: "Scale flour, rava, and shortening layers for traditional Ooty Nilgiri tea-time Varkey.",
    keywords: "ooty varkey recipe, varkey biscuit calculator, nilgiri bakery pastry"
  },
  {
    id: "bakery-07-cream-bun",
    name: "South Indian Bakery Cream Bun",
    category: "Breads",
    stdYield: 6,
    yieldUnit: "buns",
    ingredients: [
      { name: "Sweet Milk Bun Dough (Maida, Yeast, Sugar, Milk)", qty: 350 },
      { name: "Bakery Vanilla Buttercream / Fresh Cream", qty: 200 },
      { name: "Mix Fruit Jam", qty: 60 },
      { name: "Tutti Frutti / Cherry for Top", qty: 20 }
    ],
    instructions: [
      { stepNumber: 1, text: "Bake soft golden sweet round milk buns and let cool completely." },
      { stepNumber: 2, text: "Slit bun horizontally 3/4th way through." },
      { stepNumber: 3, text: "Pipe generous layer of fluffy vanilla buttercream and dollop of red fruit jam inside." },
      { stepNumber: 4, text: "Garnish top with tutti frutti and serve fresh." }
    ],
    prepTimeMinutes: 90,
    cookTimeMinutes: 18,
    slug: "bakery-cream-bun-recipe-calculator",
    metaTitle: "Bakery Cream Bun Recipe & Buttercream Filling Calculator",
    metaDescription: "Calculate sweet bun dough and vanilla buttercream ratio for classic bakery cream buns.",
    keywords: "cream bun recipe, bakery cream bun calculator, butter jam bun"
  },
  {
    id: "bakery-08-butterscotch-cake",
    name: "Bakery Butterscotch Crunch Cake",
    category: "Cakes",
    stdYield: 1,
    yieldUnit: "kg",
    ingredients: [
      { name: "Vanilla Sponge Base", qty: 450 },
      { name: "Butterscotch Flavored Whipped Cream", qty: 400 },
      { name: "Homemade Praline / Cashew Sugar Crunch", qty: 150 },
      { name: "Butterscotch Caramel Sauce", qty: 100 }
    ],
    instructions: [
      { stepNumber: 1, text: "Prepare cashew sugar praline by caramelizing sugar, stirring in cashews, cooling, and crushing." },
      { stepNumber: 2, text: "Slice vanilla sponge into 3 layers and moisten with sugar syrup." },
      { stepNumber: 3, text: "Layer with butterscotch cream, caramel sauce, and crunchy praline pieces." },
      { stepNumber: 4, text: "Frost exterior with butterscotch cream and coat sides completely with crushed praline crunch." }
    ],
    prepTimeMinutes: 30,
    cookTimeMinutes: 30,
    slug: "butterscotch-crunch-cake-calculator",
    metaTitle: "Butterscotch Crunch Cake Recipe & Praline Ratio Calculator",
    metaDescription: "Calculate cashew praline crunch, butterscotch caramel sauce, and sponge cake ratios.",
    keywords: "butterscotch cake recipe, praline cake calculator, bakery butterscotch scale"
  },
  {
    id: "bakery-09-red-velvet-cake",
    name: "Eggless Red Velvet Cream Cheese Cake",
    category: "Cakes",
    stdYield: 1,
    yieldUnit: "kg",
    ingredients: [
      { name: "Flour (Maida)", qty: 250 },
      { name: "Cocoa Powder", qty: 15 },
      { name: "Sugar", qty: 250 },
      { name: "Butter / Oil", qty: 120 },
      { name: "Buttermilk (Curd + Milk)", qty: 240 },
      { name: "Red Food Color", qty: 10 },
      { name: "Cream Cheese Frosting", qty: 400 }
    ],
    instructions: [
      { stepNumber: 1, text: "Whisk buttermilk, red color, oil, and vanilla together." },
      { stepNumber: 2, text: "Sift flour, cocoa, baking soda, and salt; combine with wet ingredients." },
      { stepNumber: 3, text: "Bake red velvet sponge layers at 175°C for 30 minutes." },
      { stepNumber: 4, text: "Whip cream cheese, butter, and icing sugar until silky. Layer and frost cake." }
    ],
    prepTimeMinutes: 25,
    cookTimeMinutes: 30,
    slug: "red-velvet-cream-cheese-cake-calculator",
    metaTitle: "Red Velvet Cream Cheese Cake Recipe & Frosting Calculator",
    metaDescription: "Scale cocoa, buttermilk, red velvet sponge, and cream cheese frosting proportions for 1kg cake.",
    keywords: "red velvet cake recipe, cream cheese frosting calculator, eggless red velvet scale"
  },
  {
    id: "bakery-10-pineapple-pastry",
    name: "Fresh Pineapple Bakery Pastry Cake",
    category: "Cakes",
    stdYield: 1,
    yieldUnit: "kg",
    ingredients: [
      { name: "Soft Vanilla Sponge", qty: 450 },
      { name: "Whipped Cream", qty: 400 },
      { name: "Cooked Pineapple Compote / Chunks", qty: 200 },
      { name: "Pineapple Juice Soak Syrup", qty: 100 }
    ],
    instructions: [
      { stepNumber: 1, text: "Cook fresh pineapple tidbits with sugar until soft compote forms." },
      { stepNumber: 2, text: "Soak vanilla sponge cake with pineapple syrup." },
      { stepNumber: 3, text: "Spread whipped cream and layer pineapple compote generously between sponge layers." },
      { stepNumber: 4, text: "Decorate top with pineapple slices, cherries, and piping cream." }
    ],
    prepTimeMinutes: 25,
    cookTimeMinutes: 30,
    slug: "pineapple-pastry-cake-calculator",
    metaTitle: "Fresh Pineapple Bakery Pastry Cake Recipe & Compote Scaler",
    metaDescription: "Calculate vanilla sponge, pineapple compote, and whipped cream proportions for fresh pineapple pastry.",
    keywords: "pineapple cake recipe, pineapple pastry calculator, bakery cake scaling"
  },
  {
    id: "bakery-11-veg-puff",
    name: "Bakery Style Spicy Vegetable Puff",
    category: "Puffs & Savories",
    stdYield: 8,
    yieldUnit: "puffs",
    ingredients: [
      { name: "Puff Pastry Sheets (Flour + Butter/Shortening Layers)", qty: 400 },
      { name: "Boiled Potato, Carrot & Green Peas Masala", qty: 300 },
      { name: "Garam Masala & Red Chilli Powder", qty: 15 },
      { name: "Milk / Egg Wash for Glaze", qty: 20 }
    ],
    instructions: [
      { stepNumber: 1, text: "Prepare spicy onion-potato-pea masala filling with turmeric, garam masala, and chillies." },
      { stepNumber: 2, text: "Roll out puff pastry sheet and cut into 4x4 inch squares." },
      { stepNumber: 3, text: "Place spoonful of cooled masala filling in center and fold into rectangle or envelope shape." },
      { stepNumber: 4, text: "Brush top with milk/egg wash and bake at 200°C (400°F) for 25 minutes until puff-layered and deep golden brown." }
    ],
    prepTimeMinutes: 30,
    cookTimeMinutes: 25,
    slug: "bakery-spicy-veg-puff-calculator",
    metaTitle: "Bakery Style Spicy Vegetable Puff Recipe & Pastry Calculator",
    metaDescription: "Calculate puff pastry dough layers and spicy potato masala filling for bakery veg puffs.",
    keywords: "veg puff recipe, bakery vegetable puff calculator, puff pastry masala scale"
  },
  {
    id: "bakery-12-egg-puff",
    name: "Bakery Style Masala Egg Puff",
    category: "Puffs & Savories",
    stdYield: 6,
    yieldUnit: "puffs",
    ingredients: [
      { name: "Puff Pastry Dough", qty: 350 },
      { name: "Hard Boiled Eggs (Halved)", qty: 3 },
      { name: "Spicy Onion Tomato Gravy / Thokku", qty: 150 },
      { name: "Pepper & Curry Powder", qty: 10 }
    ],
    instructions: [
      { stepNumber: 1, text: "Saute sliced onions with ginger garlic, tomatoes, chilli, and curry powder until thick onion thokku forms." },
      { stepNumber: 2, text: "Cut puff pastry dough into squares." },
      { stepNumber: 3, text: "Place 1 tbsp onion thokku, top with half boiled egg cut side down." },
      { stepNumber: 4, text: "Seal edges tightly and bake at 200°C for 25 minutes until puffed and crispy." }
    ],
    prepTimeMinutes: 25,
    cookTimeMinutes: 25,
    slug: "bakery-masala-egg-puff-calculator",
    metaTitle: "Bakery Style Masala Egg Puff Recipe & Thokku Calculator",
    metaDescription: "Scale boiled egg, onion thokku gravy, and flaky puff pastry for bakery egg puffs.",
    keywords: "egg puff recipe, bakery egg puff calculator, south indian bakery puff"
  },
  {
    id: "bakery-13-butter-biscuit",
    name: "Iyengar Bakery Vennai Biscuit (Butter Biscuit)",
    category: "Cookies",
    stdYield: 500,
    yieldUnit: "grams (approx 30 biscuits)",
    ingredients: [
      { name: "Maida (Flour)", qty: 250 },
      { name: "Unsalted Soft Butter", qty: 150 },
      { name: "Powdered Sugar", qty: 100 },
      { name: "Cardamom Powder / Vanilla", qty: 5 }
    ],
    instructions: [
      { stepNumber: 1, text: "Cream soft room temperature butter and powdered sugar until light and pale." },
      { stepNumber: 2, text: "Fold in sifted maida flour and cardamom to form soft non-sticky dough." },
      { stepNumber: 3, text: "Shape into round discs or cross-cut squares." },
      { stepNumber: 4, text: "Bake at 160°C (320°F) for 15-18 minutes until bottom is light golden." }
    ],
    prepTimeMinutes: 15,
    cookTimeMinutes: 18,
    slug: "iyengar-bakery-butter-biscuit-calculator",
    metaTitle: "Iyengar Bakery Vennai Biscuit (Butter Biscuit) Calculator",
    metaDescription: "Calculate butter, sugar, and flour proportions for melt-in-the-mouth bakery butter biscuits.",
    keywords: "butter biscuit recipe, iyengar bakery biscuit calculator, vennai biscuit scale"
  },
  {
    id: "bakery-14-chocolate-truffle",
    name: "Rich Chocolate Truffle Cake",
    category: "Cakes",
    stdYield: 1,
    yieldUnit: "kg",
    ingredients: [
      { name: "Dark Chocolate Sponge", qty: 450 },
      { name: "Dark Chocolate Ganache (50% Dark Choco + 50% Cream)", qty: 450 },
      { name: "Sugar Syrup Soak", qty: 100 }
    ],
    instructions: [
      { stepNumber: 1, text: "Melt dark chocolate with warm fresh cream to form smooth shiny ganache." },
      { stepNumber: 2, text: "Layer chocolate sponge soaked in sugar syrup with chocolate ganache." },
      { stepNumber: 3, text: "Coat outside smoothly with thick chocolate ganache and glaze." }
    ],
    prepTimeMinutes: 30,
    cookTimeMinutes: 30,
    slug: "rich-chocolate-truffle-cake-calculator",
    metaTitle: "Rich Chocolate Truffle Cake Recipe & Ganache Calculator",
    metaDescription: "Scale 50/50 dark chocolate to cream ganache ratio and sponge weight for 1kg Truffle Cake.",
    keywords: "chocolate truffle cake recipe, ganache calculator, bakery truffle cake"
  },
  {
    id: "bakery-15-rusk",
    name: "Bakery Style Crispy Milk Rusk",
    category: "Breads",
    stdYield: 500,
    yieldUnit: "grams",
    ingredients: [
      { name: "Sweet Bread Loaf (Maida, Milk, Sugar, Yeast, Elaichi)", qty: 450 },
      { name: "Butter for brushing", qty: 30 }
    ],
    instructions: [
      { stepNumber: 1, text: "Bake dense sweet milk cardamom bread loaf and let cool for 24 hours." },
      { stepNumber: 2, text: "Slice bread into 1/2 inch thick rectangular slices." },
      { stepNumber: 3, text: "Arrange on wire racks and slow bake double-bake at 140°C (280°F) for 45 minutes turning halfway until completely dry and crispy." }
    ],
    prepTimeMinutes: 20,
    cookTimeMinutes: 45,
    slug: "bakery-crispy-milk-rusk-calculator",
    metaTitle: "Bakery Style Crispy Milk Rusk Double Bake Calculator",
    metaDescription: "Calculate bread loaf batch, elaichi flavor, and double-baking timing for crispy tea rusks.",
    keywords: "milk rusk recipe, bakery rusk calculator, tea time rusk scale"
  },
  {
    id: "bakery-16-khara-bun",
    name: "Iyengar Bakery Khara Masala Bun",
    category: "Breads",
    stdYield: 8,
    yieldUnit: "buns",
    ingredients: [
      { name: "Maida (Flour)", qty: 350 },
      { name: "Instant Yeast", qty: 7 },
      { name: "Sauteed Masala (Onion, Green Chilli, Cumin, Mustard, Curry Leaves, Hing)", qty: 120 },
      { name: "Butter & Milk", qty: 80 }
    ],
    instructions: [
      { stepNumber: 1, text: "Saute finely chopped onions, green chillies, cumin, and curry leaves in butter till soft." },
      { stepNumber: 2, text: "Knead flour, yeast, milk, and sauteed masala into soft savory dough. Rest 1 hour." },
      { stepNumber: 3, text: "Shape into round buns, proof 30 minutes, and bake at 190°C for 20 minutes until golden." }
    ],
    prepTimeMinutes: 90,
    cookTimeMinutes: 20,
    slug: "iyengar-bakery-khara-bun-calculator",
    metaTitle: "Iyengar Bakery Khara Masala Bun Recipe & Dough Calculator",
    metaDescription: "Calculate dough to sauteed onion masala ratio for savory Iyengar bakery khara buns.",
    keywords: "khara bun recipe, iyengar bakery masala bun calculator, savory bread"
  },
  {
    id: "bakery-17-swiss-roll",
    name: "Bakery Mix Fruit Jam Swiss Roll",
    category: "Cakes",
    stdYield: 1,
    yieldUnit: "kg (approx 10 roll slices)",
    ingredients: [
      { name: "Thin Vanilla Sponge Sheet (Eggs, Flour, Sugar)", qty: 400 },
      { name: "Mixed Fruit Jam", qty: 200 },
      { name: "Icing Sugar for dusting", qty: 30 }
    ],
    instructions: [
      { stepNumber: 1, text: "Bake thin flexible sponge sheet on jelly roll pan at 200°C for 8-10 minutes." },
      { stepNumber: 2, text: "Turn out onto towel dusted with icing sugar and roll warm immediately; cool." },
      { stepNumber: 3, text: "Unroll gently, spread thick mixed fruit jam, and roll back tightly." },
      { stepNumber: 4, text: "Slice into colorful spiral round pinwheels." }
    ],
    prepTimeMinutes: 20,
    cookTimeMinutes: 10,
    slug: "bakery-jam-swiss-roll-calculator",
    metaTitle: "Bakery Mix Fruit Jam Swiss Roll Recipe & Ratio Calculator",
    metaDescription: "Calculate sponge sheet thickness and fruit jam spread ratio for bakery Swiss rolls.",
    keywords: "swiss roll recipe, jam roll calculator, bakery roll cake"
  },
  {
    id: "bakery-18-tutti-frutti-cake",
    name: "Bakery Style Tutti Frutti Tea Cake",
    category: "Cakes",
    stdYield: 1,
    yieldUnit: "kg loaf",
    ingredients: [
      { name: "Maida (Flour)", qty: 250 },
      { name: "Butter", qty: 200 },
      { name: "Sugar", qty: 200 },
      { name: "Eggs", qty: 200 },
      { name: "Colored Tutti Frutti (Floured)", qty: 150 },
      { name: "Vanilla & Pineapple Essence", qty: 8 }
    ],
    instructions: [
      { stepNumber: 1, text: "Toss tutti frutti in 1 tbsp flour to prevent sinking during baking." },
      { stepNumber: 2, text: "Cream butter and sugar, beat eggs, and fold in flour and essences." },
      { stepNumber: 3, text: "Gently fold in floured tutti frutti." },
      { stepNumber: 4, text: "Pour into loaf pans and bake at 175°C for 40-45 minutes until golden." }
    ],
    prepTimeMinutes: 15,
    cookTimeMinutes: 45,
    slug: "bakery-tutti-frutti-tea-cake-calculator",
    metaTitle: "Bakery Style Tutti Frutti Tea Cake Recipe Calculator",
    metaDescription: "Scale flour, butter, eggs, and tutti frutti dry fruits for tea time bakery loaf cake.",
    keywords: "tutti frutti cake recipe, bakery tea cake calculator, loaf cake batch scale"
  },
  {
    id: "bakery-19-salt-biscuit",
    name: "Bakery Salt & Cumin Biscuits",
    category: "Cookies",
    stdYield: 500,
    yieldUnit: "grams",
    ingredients: [
      { name: "Maida", qty: 250 },
      { name: "Butter", qty: 120 },
      { name: "Powdered Sugar", qty: 40 },
      { name: "Cumin Seeds (Jeera)", qty: 15 },
      { name: "Salt", qty: 8 },
      { name: "Baking Powder", qty: 4 }
    ],
    instructions: [
      { stepNumber: 1, text: "Cream butter, sugar, and salt together." },
      { stepNumber: 2, text: "Mix dry ingredients and roasted jeera seeds to form dough." },
      { stepNumber: 3, text: "Roll 1/4th inch thick, cut with fluted cutter, and prick with fork." },
      { stepNumber: 4, text: "Bake at 175°C for 15-20 minutes until crisp." }
    ],
    prepTimeMinutes: 15,
    cookTimeMinutes: 20,
    slug: "bakery-salt-jeera-biscuit-calculator",
    metaTitle: "Bakery Salt & Jeera Cumin Biscuit Recipe Calculator",
    metaDescription: "Scale butter, jeera cumin, and flour for savory bakery salt biscuits.",
    keywords: "salt biscuit recipe, jeera biscuit calculator, bakery savory biscuit"
  },
  {
    id: "bakery-20-cream-roll",
    name: "Crispy Puff Pastry Cream Roll",
    category: "Pastries",
    stdYield: 8,
    yieldUnit: "rolls",
    ingredients: [
      { name: "Laminated Puff Pastry Dough", qty: 350 },
      { name: "Vanilla Bakery Cream / Whipped Cream", qty: 200 },
      { name: "Sugar Dusting", qty: 30 }
    ],
    instructions: [
      { stepNumber: 1, text: "Cut puff pastry into long strips and wrap overlapping around stainless steel cream horn moulds." },
      { stepNumber: 2, text: "Bake at 200°C for 20 minutes until puffed and golden brown." },
      { stepNumber: 3, text: "Unmould cool pastry tubes and pipe sweet vanilla cream into hollow center." }
    ],
    prepTimeMinutes: 25,
    cookTimeMinutes: 20,
    slug: "puff-pastry-cream-roll-calculator",
    metaTitle: "Crispy Puff Pastry Cream Roll Recipe & Cream Scaler",
    metaDescription: "Calculate puff pastry dough strips and vanilla cream filling for crispy cream rolls.",
    keywords: "cream roll recipe, bakery cream roll calculator, puff pastry horn"
  }
];

export async function seedTop50TamilNaduRecipes() {
  try {
    const db = await (await import("./models/db")).getDb();
    const now = new Date().toISOString();

    for (const r of TOP_BAKERY_CAKES_RECIPES) {
      const existing = await querySqlAll<any>(db, "SELECT id FROM recipes WHERE id = ? OR slug = ?", [r.id, r.slug]);
      
      const ingredientsJson = JSON.stringify(r.ingredients);
      const instructionsJson = JSON.stringify(r.instructions);

      if (!existing || existing.length === 0) {
        await runSql(
          db,
          `INSERT INTO recipes (
            id, name, category, stdYield, yieldUnit, ingredients, instructions,
            prepTimeMinutes, cookTimeMinutes, slug, metaTitle, metaDescription,
            keywords, isPublic, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            r.id, r.name, r.category, r.stdYield, r.yieldUnit, ingredientsJson,
            instructionsJson, r.prepTimeMinutes, r.cookTimeMinutes, r.slug,
            r.metaTitle, r.metaDescription, r.keywords, 1, now
          ]
        );
      } else {
        // Ensure existing seed recipes are set to isPublic = 1 and updated
        await runSql(
          db,
          `UPDATE recipes SET 
            name = ?, category = ?, stdYield = ?, yieldUnit = ?, ingredients = ?,
            instructions = ?, prepTimeMinutes = ?, cookTimeMinutes = ?, slug = ?,
            metaTitle = ?, metaDescription = ?, keywords = ?, isPublic = 1, isDeleted = 0, updatedAt = ?
          WHERE id = ? OR slug = ?`,
          [
            r.name, r.category, r.stdYield, r.yieldUnit, ingredientsJson,
            instructionsJson, r.prepTimeMinutes, r.cookTimeMinutes, r.slug,
            r.metaTitle, r.metaDescription, r.keywords, now, r.id, r.slug
          ]
        );
      }
    }
    console.log(`Seeded and updated ${TOP_BAKERY_CAKES_RECIPES.length} famous bakery SEO cake & pastry recipes successfully.`);
  } catch (err) {
    console.error("Error seeding bakery recipes:", err);
  }
}
