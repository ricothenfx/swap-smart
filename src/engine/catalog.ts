import type { Allergen, Category, DietTag, Product } from "./types"

/**
 * Synthetic dark-store catalog — fictional brands, Berlin-flavoured.
 * No real products, no real brands (hard rule: demo data stays synthetic).
 */

type Row = [
  id: string,
  name: string,
  brand: string,
  category: Category,
  subcategory: string,
  price: number,
  size: string,
  dietTags: DietTag[],
  allergens: Allergen[],
  rating: number,
  popularity: number,
  hero?: boolean,
]

const ZONE: Record<Category, string> = {
  "Dairy & Eggs": "A1",
  "Bread & Bakery": "A2",
  "Fruits & Vegetables": "A3",
  Pantry: "B1",
  Drinks: "B2",
  "Snacks & Sweets": "B3",
  "Meat & Fish": "C1",
  Frozen: "C2",
  Household: "D1",
  "Personal Care": "D2",
  Baby: "D3",
  Pet: "D4",
}

const ROWS: Row[] = [
  // ---------- Dairy & Eggs ----------
  ["d1", "Whole Milk 3.8%", "Alpenhof", "Dairy & Eggs", "Milk & Drinks", 1.29, "1 L", ["vegetarian"], ["milk"], 4.7, 95, true],
  ["d2", "Semi-Skimmed Milk 1.5%", "Alpenhof", "Dairy & Eggs", "Milk & Drinks", 1.25, "1 L", ["vegetarian"], ["milk"], 4.6, 78],
  ["d3", "Lactose-Free Whole Milk", "Alpenhof", "Dairy & Eggs", "Milk & Drinks", 1.59, "1 L", ["vegetarian", "lactose-free"], ["milk"], 4.5, 55],
  ["d4", "Barista Oat Drink", "Alpenhof", "Dairy & Eggs", "Milk & Drinks", 2.19, "1 L", ["vegan", "lactose-free"], [], 4.6, 62],
  ["d5", "Almond Drink Unsweetened", "Grünhof", "Dairy & Eggs", "Milk & Drinks", 1.99, "1 L", ["vegan", "lactose-free"], ["nuts"], 4.3, 48],
  ["d6", "Soy Drink", "Grünhof", "Dairy & Eggs", "Milk & Drinks", 1.79, "1 L", ["vegan", "lactose-free"], ["soy"], 4.2, 44],
  ["d7", "Greek Yogurt", "Alpenhof", "Dairy & Eggs", "Yogurt", 2.49, "500 g", ["vegetarian"], ["milk"], 4.6, 52],
  ["d8", "Natural Yogurt", "Alpenhof", "Dairy & Eggs", "Yogurt", 1.89, "500 g", ["vegetarian"], ["milk"], 4.4, 58],
  ["d9", "Almond Yogurt", "Wiesenblume", "Dairy & Eggs", "Yogurt", 2.79, "400 g", ["vegan", "lactose-free"], ["nuts"], 4.1, 22],
  ["d10", "Butter", "Alpenhof", "Dairy & Eggs", "Butter & Spread", 2.79, "250 g", ["vegetarian"], ["milk"], 4.7, 82, true],
  ["d11", "Vegan Butter", "Wiesenblume", "Dairy & Eggs", "Butter & Spread", 3.29, "250 g", ["vegan", "lactose-free"], [], 4.2, 28],
  ["d12", "Margarine", "Alpenhof", "Dairy & Eggs", "Butter & Spread", 1.99, "500 g", ["vegan"], [], 4.0, 35],
  ["d13", "Free-Range Eggs", "Landhof", "Dairy & Eggs", "Eggs", 3.49, "10 pc", ["vegetarian"], ["eggs"], 4.8, 88, true],
  ["d14", "Organic Eggs", "Landhof", "Dairy & Eggs", "Eggs", 3.99, "6 pc", ["vegetarian", "organic"], ["eggs"], 4.7, 40],
  ["d15", "Gouda Slices", "Alpenhof", "Dairy & Eggs", "Cheese", 2.69, "200 g", ["vegetarian"], ["milk"], 4.4, 46],
  ["d16", "Feta Cheese", "Alpenhof", "Dairy & Eggs", "Cheese", 2.49, "200 g", ["vegetarian"], ["milk"], 4.3, 38],
  ["d17", "Vegan Cheese Slices", "Veggie Farm", "Dairy & Eggs", "Cheese", 3.49, "200 g", ["vegan", "lactose-free"], [], 3.9, 18],
  ["d18", "Cream Cheese", "Alpenhof", "Dairy & Eggs", "Cheese", 1.99, "200 g", ["vegetarian"], ["milk"], 4.5, 44],
  ["d19", "Whipping Cream", "Alpenhof", "Dairy & Eggs", "Cream", 1.69, "250 ml", ["vegetarian"], ["milk"], 4.3, 30],
  ["d20", "Skyr", "Alpenhof", "Dairy & Eggs", "Yogurt", 2.29, "500 g", ["vegetarian"], ["milk"], 4.4, 26],

  // ---------- Bread & Bakery ----------
  ["b1", "Sourdough Loaf", "Kornwerk", "Bread & Bakery", "Bread", 3.29, "750 g", ["vegan"], ["gluten"], 4.8, 74, true],
  ["b2", "Whole Grain Bread", "Kornwerk", "Bread & Bakery", "Bread", 2.99, "750 g", ["vegan"], ["gluten"], 4.6, 58],
  ["b3", "Rye Bread", "Kornwerk", "Bread & Bakery", "Bread", 2.49, "500 g", ["vegan"], ["gluten"], 4.5, 42],
  ["b4", "Toast White", "Backstube", "Bread & Bakery", "Toast", 1.49, "500 g", ["vegan"], ["gluten"], 4.1, 66],
  ["b5", "Toast Whole Wheat", "Backstube", "Bread & Bakery", "Toast", 1.69, "500 g", ["vegan"], ["gluten"], 4.2, 38],
  ["b6", "Baguette", "Kornwerk", "Bread & Bakery", "Bread", 1.79, "250 g", ["vegan"], ["gluten"], 4.5, 50],
  ["b7", "Ciabatta", "Kornwerk", "Bread & Bakery", "Bread", 2.19, "300 g", ["vegan"], ["gluten"], 4.4, 28],
  ["b8", "Croissant", "Backstube", "Bread & Bakery", "Pastry", 2.99, "4 pc", ["vegetarian"], ["gluten", "milk", "eggs"], 4.6, 44],
  ["b9", "Seeded Rolls", "Kornwerk", "Bread & Bakery", "Rolls", 2.49, "5 pc", ["vegan"], ["gluten"], 4.4, 32],
  ["b10", "Gluten-Free Bread", "Glücklich", "Bread & Bakery", "Bread", 3.99, "400 g", ["vegan", "gluten-free"], [], 3.8, 15],

  // ---------- Fruits & Vegetables ----------
  ["f1", "Bananas", "Grüngut", "Fruits & Vegetables", "Fruit", 1.99, "1 kg", ["vegan"], [], 4.6, 92, true],
  ["f2", "Bananas Organic", "Grüngut", "Fruits & Vegetables", "Fruit", 2.79, "1 kg", ["vegan", "organic"], [], 4.7, 35],
  ["f3", "Apples Elstar", "Grüngut", "Fruits & Vegetables", "Fruit", 2.49, "1 kg", ["vegan"], [], 4.5, 70],
  ["f4", "Apples Braeburn", "Grüngut", "Fruits & Vegetables", "Fruit", 2.69, "1 kg", ["vegan"], [], 4.4, 33],
  ["f5", "Vine Tomatoes", "Grüngut", "Fruits & Vegetables", "Vegetables", 2.29, "500 g", ["vegan"], [], 4.4, 62],
  ["f6", "Cucumber", "Grüngut", "Fruits & Vegetables", "Vegetables", 1.19, "1 pc", ["vegan"], [], 4.3, 48],
  ["f7", "Lettuce", "Grüngut", "Fruits & Vegetables", "Vegetables", 1.49, "1 pc", ["vegan"], [], 4.1, 30],
  ["f8", "Potatoes", "Grüngut", "Fruits & Vegetables", "Vegetables", 2.99, "2 kg", ["vegan"], [], 4.4, 64],
  ["f9", "Onions", "Grüngut", "Fruits & Vegetables", "Vegetables", 1.59, "1 kg", ["vegan"], [], 4.3, 52],
  ["f10", "Avocados", "Grüngut", "Fruits & Vegetables", "Fruit", 2.99, "2 pc", ["vegan"], [], 4.3, 45],
  ["f11", "Bell Peppers", "Grüngut", "Fruits & Vegetables", "Vegetables", 2.49, "500 g", ["vegan"], [], 4.3, 40],
  ["f12", "Baby Spinach", "Grüngut", "Fruits & Vegetables", "Vegetables", 1.99, "200 g", ["vegan"], [], 4.2, 26],
  ["f13", "Lemons", "Grüngut", "Fruits & Vegetables", "Fruit", 1.99, "500 g", ["vegan"], [], 4.4, 34],
  ["f14", "Garlic", "Grüngut", "Fruits & Vegetables", "Vegetables", 1.29, "200 g", ["vegan"], [], 4.4, 28],

  // ---------- Pantry ----------
  ["p1", "Penne Rigate", "Riflesso", "Pantry", "Pasta", 1.49, "500 g", ["vegan"], ["gluten"], 4.4, 60],
  ["p2", "Spaghetti", "Riflesso", "Pantry", "Pasta", 1.49, "500 g", ["vegan"], ["gluten"], 4.4, 54],
  ["p3", "Gluten-Free Penne", "Glücklich", "Pantry", "Pasta", 2.49, "500 g", ["vegan", "gluten-free"], [], 3.9, 16],
  ["p4", "Tomato Passata", "Riflesso", "Pantry", "Sauce", 1.79, "500 ml", ["vegan"], [], 4.5, 48],
  ["p5", "Basil Pesto", "Nonna's", "Pantry", "Sauce", 2.99, "190 g", ["vegetarian"], ["milk", "nuts"], 4.5, 30],
  ["p6", "Olive Oil Extra Virgin", "Golden Harvest", "Pantry", "Oil", 6.99, "500 ml", ["vegan"], [], 4.7, 40],
  ["p7", "Sunflower Oil", "Sonnenblume", "Pantry", "Oil", 2.79, "1 L", ["vegan"], [], 4.2, 28],
  ["p8", "Basmati Rice", "Mühle", "Pantry", "Rice & Grains", 3.29, "1 kg", ["vegan"], [], 4.5, 46],
  ["p9", "Jasmine Rice", "Mühle", "Pantry", "Rice & Grains", 3.19, "1 kg", ["vegan"], [], 4.4, 25],
  ["p10", "Wheat Flour", "Küchenmeister", "Pantry", "Baking", 0.99, "1 kg", ["vegan"], ["gluten"], 4.3, 42],
  ["p11", "Sugar", "Zuckerhaus", "Pantry", "Baking", 1.29, "500 g", ["vegan"], [], 4.3, 30],
  ["p12", "Sea Salt", "Salzstein", "Pantry", "Spices", 0.99, "500 g", ["vegan"], [], 4.5, 34],
  ["p13", "Soy Sauce", "Fermenthaus", "Pantry", "Sauce", 2.29, "250 ml", ["vegan"], ["soy", "gluten"], 4.5, 20],
  ["p14", "Apple Vinegar", "Fermenthaus", "Pantry", "Oil", 1.79, "500 ml", ["vegan"], [], 4.3, 14],

  // ---------- Drinks ----------
  ["k1", "Still Water", "Quellfrisch", "Drinks", "Water", 3.49, "6 × 1.5 L", ["vegan"], [], 4.6, 76],
  ["k2", "Sparkling Water", "Quellfrisch", "Drinks", "Water", 3.49, "6 × 1.5 L", ["vegan"], [], 4.6, 72],
  ["k3", "Cola", "Citro", "Drinks", "Soft Drinks", 1.99, "1.5 L", ["vegan"], [], 4.3, 68],
  ["k4", "Cola Zero", "Citro", "Drinks", "Soft Drinks", 1.99, "1.5 L", ["vegan"], [], 4.2, 50],
  ["k5", "Orange Soda", "Citro", "Drinks", "Soft Drinks", 1.79, "1.5 L", ["vegan"], [], 4.1, 30],
  ["k6", "Apple Juice", "Beerenwald", "Drinks", "Juice", 1.99, "1 L", ["vegan"], [], 4.4, 44],
  ["k7", "Orange Juice", "Beerenwald", "Drinks", "Juice", 2.29, "1 L", ["vegan"], [], 4.4, 40],
  ["k8", "Iced Tea Lemon", "Bergquelle", "Drinks", "Soft Drinks", 1.49, "1.5 L", ["vegan"], [], 4.0, 24],
  ["k9", "Ground Coffee", "Röstkunst", "Drinks", "Coffee & Tea", 5.99, "500 g", ["vegan"], [], 4.7, 58],
  ["k10", "Espresso Beans", "Röstkunst", "Drinks", "Coffee & Tea", 11.99, "1 kg", ["vegan"], [], 4.8, 34],
  ["k11", "Earl Grey Tea", "Röstkunst", "Drinks", "Coffee & Tea", 2.49, "20 bags", ["vegan"], [], 4.4, 22],
  ["k12", "Energy Drink", "Grünhof", "Drinks", "Soft Drinks", 1.29, "250 ml", ["vegan"], [], 3.9, 32],

  // ---------- Snacks & Sweets ----------
  ["s1", "Sea Salt Chips", "Knusperhaus", "Snacks & Sweets", "Chips", 1.79, "175 g", ["vegan"], [], 4.4, 66],
  ["s2", "Paprika Chips", "Knusperhaus", "Snacks & Sweets", "Chips", 1.79, "175 g", ["vegan"], [], 4.4, 58],
  ["s3", "Tortilla Chips", "Knusperhaus", "Snacks & Sweets", "Chips", 2.19, "200 g", ["vegan"], [], 4.3, 30],
  ["s4", "Milk Chocolate", "Schokowerk", "Snacks & Sweets", "Chocolate", 1.49, "100 g", ["vegetarian"], ["milk", "soy"], 4.5, 62],
  ["s5", "Dark Chocolate 70%", "Schokowerk", "Snacks & Sweets", "Chocolate", 1.59, "100 g", ["vegan"], ["soy"], 4.6, 48],
  ["s6", "Hazelnut Chocolate", "Schokowerk", "Snacks & Sweets", "Chocolate", 1.69, "100 g", ["vegetarian"], ["milk", "nuts", "soy"], 4.6, 40],
  ["s7", "Salted Peanuts", "Nusswerk", "Snacks & Sweets", "Nuts", 1.99, "200 g", ["vegan"], ["peanuts"], 4.3, 36],
  ["s8", "Mixed Nuts", "Nusswerk", "Snacks & Sweets", "Nuts", 2.99, "200 g", ["vegan"], ["nuts"], 4.4, 28],
  ["s9", "Gummy Bears", "Fruchtfreude", "Snacks & Sweets", "Sweets", 1.39, "200 g", ["vegetarian"], [], 4.2, 44],
  ["s10", "Cookie Trio", "Fruchtfreude", "Snacks & Sweets", "Cookies", 2.79, "300 g", ["vegetarian"], ["gluten", "milk", "eggs"], 4.3, 32],
  ["s11", "Sweet Popcorn", "Popcornwerk", "Snacks & Sweets", "Chips", 1.19, "100 g", ["vegan"], [], 4.1, 22],

  // ---------- Meat & Fish ----------
  ["m1", "Chicken Breast", "Weidehof", "Meat & Fish", "Meat", 5.99, "400 g", [], [], 4.3, 48],
  ["m2", "Ground Beef 20%", "Weidehof", "Meat & Fish", "Meat", 6.49, "500 g", [], [], 4.4, 52],
  ["m3", "Pork Schnitzel", "Weidehof", "Meat & Fish", "Meat", 4.99, "400 g", [], [], 4.2, 30],
  ["m4", "Salmon Fillet", "Nordfisch", "Meat & Fish", "Fish", 8.99, "250 g", [], ["fish"], 4.6, 38],
  ["m5", "Fish Sticks", "Nordfisch", "Meat & Fish", "Fish", 3.99, "450 g", [], ["fish", "gluten"], 4.0, 26],
  ["m6", "Vegan Mince", "Grünhof", "Meat & Fish", "Plant-Based", 3.99, "300 g", ["vegan"], ["soy"], 4.0, 20],
  ["m7", "Vegan Schnitzel", "Grünhof", "Meat & Fish", "Plant-Based", 3.49, "220 g", ["vegan"], ["soy"], 3.9, 14],

  // ---------- Frozen ----------
  ["z1", "Frozen Berries", "Polarfrucht", "Frozen", "Frozen Fruit", 3.49, "300 g", ["vegan"], [], 4.4, 34],
  ["z2", "Frozen Peas", "Polarfrucht", "Frozen", "Frozen Vegetables", 1.99, "450 g", ["vegan"], [], 4.3, 30],
  ["z3", "Vanilla Ice Cream", "Gelato Nord", "Frozen", "Ice Cream", 3.99, "500 ml", ["vegetarian"], ["milk", "eggs"], 4.5, 44],
  ["z4", "Stracciatella Ice Cream", "Gelato Nord", "Frozen", "Ice Cream", 3.99, "500 ml", ["vegetarian"], ["milk"], 4.6, 36],
  ["z5", "Pizza Margherita", "Frostwerk", "Frozen", "Frozen Pizza", 2.99, "350 g", ["vegetarian"], ["gluten", "milk"], 4.1, 56],
  ["z6", "Pizza Salami", "Frostwerk", "Frozen", "Frozen Pizza", 3.29, "350 g", [], ["gluten", "milk"], 4.2, 42],
  ["z7", "Frozen Fries", "Frostwerk", "Frozen", "Frozen Vegetables", 2.49, "750 g", ["vegan"], [], 4.2, 50],

  // ---------- Household ----------
  ["h1", "Dish Soap", "Klarpure", "Household", "Cleaning", 1.49, "500 ml", [], [], 4.3, 40],
  ["h2", "Laundry Detergent", "Klarpure", "Household", "Cleaning", 4.99, "20 washes", [], [], 4.4, 38],
  ["h3", "All-Purpose Cleaner", "Klarpure", "Household", "Cleaning", 1.99, "1 L", [], [], 4.2, 26],
  ["h4", "Toilet Paper", "Weichheit", "Household", "Paper", 4.49, "10 rolls", [], [], 4.5, 62],
  ["h5", "Paper Towels", "Weichheit", "Household", "Paper", 2.29, "4 rolls", [], [], 4.4, 44],
  ["h6", "Trash Bags 20 L", "Müllmeister", "Household", "Waste", 2.99, "25 pc", [], [], 4.2, 30],
  ["h7", "Lighter", "Flammschutz", "Household", "Misc", 1.29, "1 pc", [], [], 4.0, 12],

  // ---------- Personal Care ----------
  ["c1", "Shower Gel", "Sankt Haut", "Personal Care", "Body Care", 1.99, "300 ml", [], [], 4.3, 34],
  ["c2", "Shampoo", "Sankt Haut", "Personal Care", "Hair Care", 2.49, "300 ml", [], [], 4.2, 32],
  ["c3", "Toothpaste", "Zahnweiß", "Personal Care", "Oral Care", 1.99, "75 ml", [], [], 4.4, 48],
  ["c4", "Hand Soap", "ReinAntibac", "Personal Care", "Body Care", 1.49, "250 ml", [], [], 4.1, 22],

  // ---------- Baby ----------
  ["a1", "Diapers Size 4", "Kleine Wolke", "Baby", "Diapers", 8.99, "40 pc", [], [], 4.5, 24],
  ["a2", "Baby Wipes", "Kleine Wolke", "Baby", "Wipes", 1.79, "60 pc", [], [], 4.4, 28],
  ["a3", "Baby Formula", "Sonnenschein", "Baby", "Formula", 13.99, "600 g", [], ["milk"], 4.6, 12],

  // ---------- Pet ----------
  ["t1", "Dog Food Beef", "Tierglück", "Pet", "Dog", 4.99, "800 g", [], [], 4.4, 18],
  ["t2", "Cat Food Salmon", "Tierglück", "Pet", "Cat", 3.49, "400 g", [], ["fish"], 4.4, 20],
  ["t3", "Cat Litter", "Tierglück", "Pet", "Cat", 3.99, "5 L", [], [], 4.2, 14],
]

export const CATALOG: Product[] = ROWS.map(
  ([id, name, brand, category, subcategory, price, size, dietTags, allergens, rating, popularity, hero]) => ({
    id,
    name,
    brand,
    category,
    subcategory,
    price,
    size,
    dietTags,
    allergens,
    rating,
    popularity,
    zone: ZONE[category],
    ...(hero ? { hero: true } : {}),
  }),
)

const BY_ID = new Map(CATALOG.map((p) => [p.id, p]))

export function productById(id: string): Product | undefined {
  return BY_ID.get(id)
}

export function productsByCategory(category: Category): Product[] {
  return CATALOG.filter((p) => p.category === category)
}

export const CATEGORIES: Category[] = [...new Set(CATALOG.map((p) => p.category))]
export const HERO_IDS = CATALOG.filter((p) => p.hero).map((p) => p.id)
