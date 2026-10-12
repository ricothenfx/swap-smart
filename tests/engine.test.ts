import {
  CATALOG,
  productById,
  rankSubstitutes,
  runSimulation,
  impactSummary,
  generateOrders,
  swapMessage,
  type Order,
  type ShelfState,
} from "../src/engine"

const EMPTY_SHELF: ShelfState = { outOfStock: new Set() }

const MIXED_ORDER: Order = {
  id: "T-1",
  profile: { diet: "mixed", priceSensitivity: 0.5 },
  lines: [{ productId: "d1", qty: 1 }],
  ageMinutes: 3,
}

describe("catalog", () => {
  it("has unique ids", () => {
    const ids = new Set(CATALOG.map((p) => p.id))
    expect(ids.size).toBe(CATALOG.length)
  })

  it("has heroes and at least 90 products", () => {
    expect(CATALOG.length).toBeGreaterThanOrEqual(90)
    expect(CATALOG.filter((p) => p.hero).length).toBeGreaterThanOrEqual(5)
  })
})

describe("similarity", () => {
  it("scores a near-identical product higher than a distant one", () => {
    const wholeMilk = productById("d1")!
    const semi = productById("d2")!
    const toiletPaper = productById("h4")!
    const near = rankSubstitutes(wholeMilk, MIXED_ORDER, EMPTY_SHELF)
    const semiScore = near.candidates.find((c) => c.product.id === semi.id)!.score
    expect(semiScore).toBeGreaterThan(50)
    // cross-category never even appears as candidate
    expect(near.candidates.some((c) => c.product.id === toiletPaper.id)).toBe(false)
  })
})

describe("substitute engine — hard rules", () => {
  const wholeMilk = productById("d1")!

  it("never suggests out-of-stock products", () => {
    const shelf: ShelfState = { outOfStock: new Set(["d2", "d4"]) }
    const { candidates, blocked } = rankSubstitutes(wholeMilk, MIXED_ORDER, shelf)
    expect(candidates.some((c) => shelf.outOfStock.has(c.product.id))).toBe(false)
    expect(blocked.some((b) => b.blockKind === "out-of-stock" && b.product.id === "d2")).toBe(true)
  })

  it("never suggests allergen violations for nut-allergy baskets", () => {
    const order: Order = { ...MIXED_ORDER, profile: { diet: "nut-allergy", priceSensitivity: 0.5 } }
    const chocolate = productById("s4")! // milk chocolate — no nuts
    const hazelnut = productById("s6")! // hazelnut chocolate — nuts
    const { candidates, blocked } = rankSubstitutes(chocolate, order, EMPTY_SHELF)
    expect(candidates.some((c) => c.product.id === hazelnut.id)).toBe(false)
    expect(blocked.some((b) => b.product.id === hazelnut.id && b.blockKind === "allergen")).toBe(true)
  })

  it("never suggests dairy for a vegan basket", () => {
    const order: Order = { ...MIXED_ORDER, profile: { diet: "vegan", priceSensitivity: 0.5 } }
    const { candidates } = rankSubstitutes(wholeMilk, order, EMPTY_SHELF)
    // the order itself is vegan, so whole milk being OOS is hypothetical —
    // but every suggestion must be vegan
    expect(candidates.every((c) => c.product.dietTags.includes("vegan"))).toBe(true)
  })

  it("enforces the price guardrail", () => {
    const { blocked } = rankSubstitutes(wholeMilk, MIXED_ORDER, EMPTY_SHELF)
    for (const b of blocked.filter((x) => x.blockKind === "price-guardrail")) {
      expect(b.product.price).toBeGreaterThan(wholeMilk.price * 1.25)
    }
    expect(candidates_within_guardrail(wholeMilk, MIXED_ORDER)).toBe(true)
  })

  function candidates_within_guardrail(target: typeof wholeMilk, order: Order): boolean {
    const { candidates } = rankSubstitutes(target, order, EMPTY_SHELF)
    return candidates.every((c) => c.priceDelta <= target.price * 0.25 + 1e-9)
  }

  it("always stays inside the target category", () => {
    const { candidates } = rankSubstitutes(wholeMilk, MIXED_ORDER, EMPTY_SHELF)
    expect(candidates.every((c) => c.product.category === wholeMilk.category)).toBe(true)
  })
})

describe("simulation", () => {
  const sim = runSimulation({ orders: 300, seed: 2026 })

  it("is deterministic for a fixed seed", () => {
    const again = runSimulation({ orders: 300, seed: 2026 })
    expect(JSON.stringify(sim.smart.kpis)).toBe(JSON.stringify(again.smart.kpis))
    expect(JSON.stringify(sim.autoRefund.kpis)).toBe(JSON.stringify(again.autoRefund.kpis))
    expect(JSON.stringify(sim.smart.events)).toBe(JSON.stringify(again.smart.events))
  })

  it("different seeds give different numbers (not hardcoded)", () => {
    const other = runSimulation({ orders: 300, seed: 7 })
    expect(other.smart.kpis.retainedEur).not.toBe(sim.smart.kpis.retainedEur)
  })

  it("all policies see the same orders and OOS lines", () => {
    expect(sim.autoRefund.kpis.orders).toBe(sim.smart.kpis.orders)
    expect(sim.autoRefund.kpis.oosLines).toBe(sim.smart.kpis.oosLines)
    expect(sim.naive.kpis.oosLines).toBe(sim.smart.kpis.oosLines)
  })

  it("swap-smart retains more basket value than auto-refund", () => {
    expect(sim.smart.kpis.retainedEur).toBeGreaterThan(sim.autoRefund.kpis.retainedEur)
  })

  it("swap-smart acceptance beats naive acceptance", () => {
    expect(sim.smart.kpis.acceptanceRate).toBeGreaterThan(sim.naive.kpis.acceptanceRate)
  })

  it("KPI invariants hold", () => {
    for (const result of [sim.autoRefund, sim.naive, sim.smart]) {
      const k = result.kpis
      expect(k.acceptanceRate).toBeGreaterThanOrEqual(0)
      expect(k.acceptanceRate).toBeLessThanOrEqual(1)
      expect(k.refundRate).toBeGreaterThanOrEqual(0)
      expect(k.refundRate).toBeLessThanOrEqual(1)
      expect(k.retainedEur).toBeGreaterThan(0)
      expect(k.basketValueEur).toBeGreaterThan(k.retainedEur)
    }
    // auto-refund never offers a substitute
    expect(sim.autoRefund.kpis.subsOffered).toBe(0)
    expect(sim.autoRefund.kpis.acceptanceRate).toBe(0)
  })

  it("events reference known orders and products", () => {
    const orderIds = new Set(sim.smart.orders.map((o) => o.order.id))
    for (const e of sim.smart.events) {
      expect(orderIds.has(e.orderId)).toBe(true)
      if (e.kind !== "order-cancelled") {
        expect(productById(e.productId)).toBeDefined()
      }
    }
  })
})

describe("impact summary", () => {
  it("projects a positive net impact for swap-smart vs auto-refund", () => {
    const sim = runSimulation({ orders: 500, seed: 42 })
    const s = impactSummary(sim)
    expect(s.netImpactEurPerMonth).toBeGreaterThan(0)
    expect(s.refundsAvoidedPerMonth).toBeGreaterThan(0)
    expect(s.pickerHoursSavedPerMonth).toBeGreaterThan(0)
    expect(s.ordersSavedPerMonth).toBeGreaterThan(0)
  })
})

describe("orders", () => {
  it("respects dietary profiles", () => {
    const orders = generateOrders(200, 99)
    const vegan = orders.find((o) => o.profile.diet === "vegan")
    expect(vegan).toBeDefined()
    for (const line of vegan!.lines) {
      const p = productById(line.productId)!
      expect(p.dietTags).toContain("vegan")
    }
    const nutAllergy = orders.filter((o) => o.profile.diet === "nut-allergy")
    for (const o of nutAllergy) {
      for (const line of o.lines) {
        const p = productById(line.productId)!
        expect(p.allergens).not.toContain("nuts")
        expect(p.allergens).not.toContain("peanuts")
      }
    }
  })
})

describe("messages", () => {
  it("renders in all locales", () => {
    const target = productById("d1")!
    const sub = productById("d4")!
    for (const locale of ["en", "de", "id"] as const) {
      const msg = swapMessage({ target, sub, priceDelta: sub.price - target.price, locale })
      expect(msg).toContain("Alpenhof")
      expect(msg.length).toBeGreaterThan(40)
    }
  })
})
