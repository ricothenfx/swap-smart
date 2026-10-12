import { CATALOG } from "./catalog"
import { fitsProfile } from "./orders"
import { similarity } from "./similarity"
import type {
  BlockedCandidate,
  CustomerProfile,
  Order,
  Product,
  Reason,
  ShelfState,
  SubstituteCandidate,
} from "./types"

/**
 * The substitution engine.
 *
 * Layer 1 — HARD RULES (never negotiable, never AI):
 *   in stock · allergen-safe · diet-safe · price guardrail · same category.
 * Layer 2 — SCORE (explainable composite, 0–100):
 *   semantic 38 · price 20 · diet fit 14 · popularity 12 · subcategory 8 · rating 8.
 * Layer 3 — ACCEPTANCE MODEL:
 *   a transparent probability formula, not a black box.
 */

export const DEFAULT_PRICE_UPLIFT_CAP = 0.25 // refuse substitutes >25% pricier

const WEIGHTS = {
  semantic: 38,
  price: 20,
  diet: 14,
  popularity: 12,
  subcategory: 8,
  rating: 8,
} as const

const CATEGORY_MATCH = new Map(
  CATALOG.map((p) => [p.id, CATALOG.filter((q) => q.category === p.category)]),
)

export function rankSubstitutes(
  target: Product,
  order: Order,
  shelf: ShelfState,
  opts: { priceUpliftCap?: number } = {},
): { candidates: SubstituteCandidate[]; blocked: BlockedCandidate[] } {
  const cap = opts.priceUpliftCap ?? DEFAULT_PRICE_UPLIFT_CAP
  const profile = order.profile
  const pool = CATEGORY_MATCH.get(target.id) ?? []
  const candidates: SubstituteCandidate[] = []
  const blocked: BlockedCandidate[] = []

  for (const product of pool) {
    if (product.id === target.id) continue

    if (shelf.outOfStock.has(product.id)) {
      blocked.push({ product, blockKind: "out-of-stock", reason: "Out of stock on the shelf right now" })
      continue
    }
    if (!fitsProfile(product, profile)) {
      if (profile.diet === "vegan") {
        blocked.push({ product, blockKind: "diet", reason: "Not vegan — this basket is vegan" })
      } else if (profile.diet === "lactose-free") {
        blocked.push({ product, blockKind: "allergen", reason: "Contains milk — basket is lactose-free" })
      } else {
        blocked.push({ product, blockKind: "allergen", reason: "Contains nuts — basket must stay nut-safe" })
      }
      continue
    }
    const priceDelta = product.price - target.price
    if (priceDelta > target.price * cap) {
      const pct = Math.round((priceDelta / target.price) * 100)
      blocked.push({
        product,
        blockKind: "price-guardrail",
        reason: `+${pct}% more expensive — above the ${Math.round(cap * 100)}% guardrail`,
      })
      continue
    }

    const sim = similarity(target, product)
    const upliftRatio = Math.max(0, priceDelta / target.price)

    const priceScore = Math.max(0, 1 - Math.abs(priceDelta / target.price) * 1.6)
    const dietScore = dietFitScore(product, profile, priceDelta)
    const subcategoryScore = product.subcategory === target.subcategory ? 1 : 0
    const ratingScore = Math.max(0, Math.min(1, (product.rating - 3.5) / 1.4))

    const score =
      WEIGHTS.semantic * sim.score +
      WEIGHTS.price * priceScore +
      WEIGHTS.diet * dietScore +
      WEIGHTS.popularity * (product.popularity / 100) +
      WEIGHTS.subcategory * subcategoryScore +
      WEIGHTS.rating * ratingScore

    const reasons = buildReasons({
      target,
      product,
      sim: sim.textMatch,
      priceDelta,
      profile,
      sameSubcategory: subcategoryScore === 1,
    })

    candidates.push({
      product,
      score: Math.round(Math.min(100, score)),
      reasons,
      priceDelta,
      pAccept: acceptanceProbability(score, upliftRatio, dietScore),
    })
  }

  candidates.sort((a, b) => b.score - a.score || a.product.price - b.product.price)
  return { candidates, blocked }
}

function dietFitScore(product: Product, profile: CustomerProfile, priceDelta: number): number {
  let s = 0.7
  if (profile.diet === "vegan" && product.dietTags.includes("vegan")) s += 0.3
  if (profile.diet === "lactose-free" && product.dietTags.includes("lactose-free")) s += 0.15
  if (profile.priceSensitivity > 0.6 && priceDelta <= 0) s += 0.15
  return Math.min(1, s)
}

function buildReasons(input: {
  target: Product
  product: Product
  sim: number
  priceDelta: number
  profile: CustomerProfile
  sameSubcategory: boolean
}): Reason[] {
  const { product, sim, priceDelta, profile, sameSubcategory } = input
  const reasons: Reason[] = []

  reasons.push({ kind: "semantic", label: `${Math.round(sim * 100)}% match` })

  if (priceDelta < -0.005) {
    reasons.push({ kind: "price", label: `€${Math.abs(priceDelta).toFixed(2)} cheaper` })
  } else if (priceDelta > 0.005) {
    reasons.push({ kind: "price", label: `+€${priceDelta.toFixed(2)}` })
  } else {
    reasons.push({ kind: "price", label: "Same price" })
  }

  if (profile.diet === "vegan" && product.dietTags.includes("vegan")) {
    reasons.push({ kind: "diet", label: "Fits vegan basket" })
  }
  if (profile.diet === "lactose-free" && product.dietTags.includes("lactose-free")) {
    reasons.push({ kind: "diet", label: "Lactose-free ✓" })
  }
  if (product.popularity >= 60) {
    reasons.push({ kind: "popularity", label: "Top seller" })
  }
  if (product.rating >= 4.5) {
    reasons.push({ kind: "rating", label: `★ ${product.rating.toFixed(1)}` })
  }
  if (sameSubcategory) {
    reasons.push({ kind: "category", label: "Same shelf row" })
  }

  return reasons
}

/** Transparent acceptance model — no black box, easy to quote in a README.
 *  A good in-person substitution (picker shows it, customer decides on the
 *  spot) accepts far more often than an anonymous app notification. */
export function acceptanceProbability(score: number, upliftRatio: number, dietScore: number): number {
  const p =
    0.46 +
    0.54 * Math.pow(score / 100, 1.05) -
    Math.max(0, upliftRatio - 0.05) * 0.5 +
    (dietScore >= 1 ? 0.02 : 0)
  return Math.max(0.2, Math.min(0.97, p))
}

/**
 * What a naive "most popular in category" bot would pick — the contrast case.
 * It ignores allergens, diet and price on purpose: that is the point.
 */
export function naiveSubstitute(
  target: Product,
  shelf: ShelfState,
): { product: Product; violatesProfile: boolean } | null {
  const pool = (CATEGORY_MATCH.get(target.id) ?? [])
    .filter((p) => p.id !== target.id && !shelf.outOfStock.has(p.id))
    .sort((a, b) => b.popularity - a.popularity)
  const pick = pool[0]
  if (!pick) return null
  // A naive bot only checks the target's own allergen overlap with nothing —
  // it does not know the customer. "violatesProfile" is decided by the caller.
  return { product: pick, violatesProfile: false }
}

export function violatesCustomerProfile(pick: Product, profile: CustomerProfile): boolean {
  return !fitsProfile(pick, profile)
}
