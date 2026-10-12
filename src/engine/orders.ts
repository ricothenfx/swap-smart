import { CATALOG, HERO_IDS, productById } from "./catalog"
import { Rng } from "../lib/rng"
import type { CustomerProfile, Order, OrderLine, Product } from "./types"

/**
 * Seeded order generation. Baskets are built so that dietary profiles leave
 * a real signal in the basket — that is what basket inference reads later.
 */

const HERO_POOL: Product[] = HERO_IDS.map((id) => productById(id)).filter(
  (p): p is Product => p !== undefined,
)

export function fitsProfile(p: Product, profile: CustomerProfile): boolean {
  switch (profile.diet) {
    case "vegan":
      return p.dietTags.includes("vegan")
    case "lactose-free":
      return !p.allergens.includes("milk")
    case "nut-allergy":
      return !p.allergens.includes("nuts") && !p.allergens.includes("peanuts")
    default:
      return true
  }
}

function sampleProfile(rng: Rng): CustomerProfile {
  const diet = rng.weighted<CustomerProfile["diet"]>([
    ["mixed", 55],
    ["vegan", 12],
    ["lactose-free", 10],
    ["nut-allergy", 8],
  ])
  let priceSensitivity = rng.range(0.1, 0.9)
  if (diet !== "mixed" && rng.chance(0.5)) priceSensitivity = rng.range(0.5, 0.95)
  return { diet, priceSensitivity }
}

function buildBasket(rng: Rng, profile: CustomerProfile): OrderLine[] {
  const allowed = CATALOG.filter((p) => fitsProfile(p, profile))
  const heroPool = HERO_POOL.filter((p) => fitsProfile(p, profile))
  const lineCount = rng.int(4, 11)
  const byId = new Map<string, OrderLine>()

  const addLine = (product: Product) => {
    const existing = byId.get(product.id)
    if (existing) {
      existing.qty += 1
    } else {
      byId.set(product.id, { productId: product.id, qty: rng.int(1, 2) })
    }
  }

  // 2–3 hero anchors (or fewer if profile restricts the pool)
  const heroes = rng.sample(heroPool, rng.int(2, 3))
  heroes.forEach(addLine)

  // rest drawn popularity-weighted from the allowed pool
  const weighted = allowed.map((p) => [p, Math.max(1, p.popularity)] as const)
  while (byId.size < lineCount) {
    addLine(rng.weighted(weighted))
  }

  return [...byId.values()]
}

export function generateOrders(count: number, seed: number): Order[] {
  const rng = new Rng(seed)
  return Array.from({ length: count }, (_, i) => {
    const profile = sampleProfile(rng)
    return {
      id: `B-${String(seed).slice(-4)}-${String(i + 1).padStart(4, "0")}`,
      profile,
      lines: buildBasket(rng, profile),
      ageMinutes: rng.int(1, 12),
    }
  })
}
