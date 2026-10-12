/** Core domain types for the Swap-Smart engine. */

export type DietTag =
  | "vegan"
  | "vegetarian"
  | "lactose-free"
  | "gluten-free"
  | "organic"

export type Allergen =
  | "milk"
  | "eggs"
  | "gluten"
  | "nuts"
  | "peanuts"
  | "soy"
  | "fish"

export interface Product {
  id: string
  name: string
  brand: string
  /** top category, e.g. "Dairy & Eggs" — substitutions never cross categories */
  category: Category
  /** finer shelf group, e.g. "Milk & Drinks" */
  subcategory: string
  price: number
  size: string
  dietTags: DietTag[]
  allergens: Allergen[]
  rating: number // 3.8 – 4.9
  /** sales popularity 0–100, drives naive matching & tie-breaks */
  popularity: number
  /** shelf zone, e.g. "A1" */
  zone: string
  hero?: boolean // high-frequency basket anchor (milk, eggs, bread, bananas)
}

export type Category =
  | "Dairy & Eggs"
  | "Bread & Bakery"
  | "Fruits & Vegetables"
  | "Pantry"
  | "Drinks"
  | "Snacks & Sweets"
  | "Meat & Fish"
  | "Frozen"
  | "Household"
  | "Personal Care"
  | "Baby"
  | "Pet"

export type CustomerProfile = {
  /** hard dietary constraints for substitution */
  diet: "mixed" | "vegan" | "lactose-free" | "nut-allergy"
  /** 0 = indifferent, 1 = very price sensitive (soft signal) */
  priceSensitivity: number
}

export interface OrderLine {
  productId: string
  qty: number
}

export interface Order {
  id: string
  profile: CustomerProfile
  lines: OrderLine[]
  /** minutes since placed — drives the queue aging UI */
  ageMinutes: number
}

export interface ShelfState {
  /** product ids currently unavailable on the shelf */
  outOfStock: ReadonlySet<string>
}

export type ReasonKind =
  | "semantic"
  | "price"
  | "diet"
  | "popularity"
  | "rating"
  | "category"

export interface Reason {
  kind: ReasonKind
  /** short chip label, e.g. "94% match" or "€0.30 cheaper" */
  label: string
}

export type BlockKind =
  | "out-of-stock"
  | "allergen"
  | "diet"
  | "price-guardrail"
  | "cross-category"

export interface BlockedCandidate {
  product: Product
  blockKind: BlockKind
  /** human explanation, e.g. "Contains nuts — this basket is nut-allergy safe" */
  reason: string
}

export interface SubstituteCandidate {
  product: Product
  /** 0–100, explainable composite */
  score: number
  reasons: Reason[]
  /** price delta vs target, negative = cheaper */
  priceDelta: number
  /** modelled probability the customer accepts this swap (0–1) */
  pAccept: number
}

export type SubstitutionDecision =
  | { kind: "substituted"; candidate: SubstituteCandidate; accepted: boolean }
  | { kind: "refunded"; blocked: BlockedCandidate[] }

export interface LineOutcome {
  order: Order
  line: OrderLine
  target: Product
  isHero: boolean
  oos: boolean
  decision: SubstitutionDecision | null // null = line was in stock, picked normally
  /** € of this line kept in the basket */
  retainedEur: number
  /** € of this line lost to refund (unit price * qty) */
  refundedEur: number
  complaint: boolean
  wastedItem: boolean
  pickerSeconds: number
}

export interface OrderOutcome {
  order: Order
  lines: LineOutcome[]
  basketValueEur: number
  retainedEur: number
  refundedEur: number
  /** order was fully cancelled because a hero item was refunded */
  cancelled: boolean
  complaint: boolean
  wastedItems: number
  pickerSeconds: number
}

export interface Kpis {
  orders: number
  oosLines: number
  subsOffered: number
  subsAccepted: number
  acceptanceRate: number // accepted / offered
  refunds: number
  refundRate: number // refunded OOS lines / OOS lines
  basketValueEur: number
  retainedEur: number
  refundedEur: number
  cancelledOrders: number
  complaints: number
  complaintsPer1k: number
  foodWasteItems: number
  pickerMinutes: number
  /** retained + refund-handling savings, projected to 30 days at 350 orders/day */
  netImpactEurPerMonth: number
}

export type Policy = "auto-refund" | "naive-sub" | "swap-smart"

export interface PolicyModel {
  /** seconds a picker spends deciding per OOS line under this policy */
  decisionSeconds: number
}

export interface PolicyResult {
  policy: Policy
  kpis: Kpis
  orders: OrderOutcome[]
  /** compact event log for replay */
  events: SimEvent[]
}

export interface SimEvent {
  orderIdx: number
  orderId: string
  kind: "oos" | "refund" | "sub-accepted" | "sub-rejected" | "order-cancelled"
  productId: string
  productName: string
  subId?: string
  subName?: string
  score?: number
  isHero: boolean
}

export interface SimConfig {
  orders: number
  seed: number
  /** probability a line is unavailable at pick time (shelf drift) */
  oosRate?: number
}

export interface Simulation {
  config: SimConfig
  /** today's default on many platforms: item is refunded automatically */
  autoRefund: PolicyResult
  /** dumb bot: most popular item in the category, blind to the customer */
  naive: PolicyResult
  /** Swap-Smart: explainable top suggestion, picker confirms */
  smart: PolicyResult
}
