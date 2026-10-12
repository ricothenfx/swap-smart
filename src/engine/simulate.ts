import { CATALOG, productById } from "./catalog"
import { generateOrders } from "./orders"
import {
  DEFAULT_PRICE_UPLIFT_CAP,
  naiveSubstitute,
  rankSubstitutes,
  violatesCustomerProfile,
} from "./substitute"
import { Rng } from "../lib/rng"
import type {
  Kpis,
  LineOutcome,
  OrderLine,
  Product,
  SubstituteCandidate,
  Order,
  OrderOutcome,
  Policy,
  PolicyModel,
  PolicyResult,
  ShelfState,
  SimConfig,
  SimEvent,
  Simulation,
} from "./types"

/**
 * Deterministic simulation: same seed => byte-identical KPIs.
 *
 * Three policies compete on identical orders + identical shelf state:
 *  - auto-refund (status quo on many platforms): OOS line refunded, no offer
 *  - naive-sub (dumb bot): most popular item in category, blind to the customer
 *  - swap-smart: engine suggestion, picker confirms in one tap
 *
 * Assumptions (documented in README):
 *  - oosRate default 8% of lines, popularity-weighted (fast movers run out
 *    more often); industry range for q-commerce picking is 5–10%
 *  - a lost hero item (milk, eggs, bread, bananas) tips 20% of affected
 *    orders into full cancellation — the customer leaves
 *  - refund handling costs €2.50 per refund (support ticket + payment reversal)
 *  - picker decision time: 40s auto-refund / 30s naive search / 6s one tap
 *  - reference store volume: 350 orders/day for the 30-day projection
 */

export const REFUND_HANDLING_EUR = 2.5
export const ORDERS_PER_DAY = 350
export const DAYS_PER_MONTH = 30

const MODELS: Record<Policy, PolicyModel> = {
  "auto-refund": { decisionSeconds: 40 },
  "naive-sub": { decisionSeconds: 30 },
  "swap-smart": { decisionSeconds: 6 },
}

function buildShelf(seed: number, oosRate: number): ShelfState {
  // Shelf drift is per scenario (one picker shift), not per order: the same
  // items stay missing for the whole run. Distinct seed stream from orders.
  // Fast movers go missing more often — OOS probability is popularity-weighted.
  const rng = new Rng(seed ^ 0x5f3759df)
  const outOfStock = new Set<string>()
  for (const p of CATALOG) {
    if (rng.chance(oosRate * (0.4 + (p.popularity / 100) * 1.5))) outOfStock.add(p.id)
  }
  // Every shift has at least one fast-mover missing — that is exactly the
  // moment Swap-Smart exists for.
  const heroes = CATALOG.filter((p) => p.hero)
  if (!heroes.some((h) => outOfStock.has(h.id))) {
    const hero = heroes[rng.int(0, heroes.length - 1)]
    if (hero) outOfStock.add(hero.id)
  }
  return { outOfStock }
}

export function runSimulation(config: SimConfig): Simulation {
  const oosRate = config.oosRate ?? 0.08
  const orders = generateOrders(config.orders, config.seed)
  const shelf = buildShelf(config.seed, oosRate)

  return {
    config: { ...config, oosRate },
    autoRefund: runPolicy(orders, shelf, "auto-refund", config.seed),
    naive: runPolicy(orders, shelf, "naive-sub", config.seed),
    smart: runPolicy(orders, shelf, "swap-smart", config.seed),
  }
}

function runPolicy(
  orders: Order[],
  shelf: ShelfState,
  policy: Policy,
  seed: number,
): PolicyResult {
  const rng = new Rng(seed ^ hashPolicy(policy))
  const events: SimEvent[] = []
  const orderOutcomes = orders.map((order, orderIdx) =>
    runOrder(order, orderIdx, shelf, policy, rng, events),
  )
  return { policy, kpis: computeKpis(policy, orderOutcomes), orders: orderOutcomes, events }
}

function runOrder(
  order: Order,
  orderIdx: number,
  shelf: ShelfState,
  policy: Policy,
  rng: Rng,
  events: SimEvent[],
): OrderOutcome {
  const lines: LineOutcome[] = []
  let retained = 0
  let refunded = 0
  let complaints = 0
  let wasted = 0
  let heroLost = false

  const basketValue = order.lines.reduce((sum, l) => {
    const p = productById(l.productId)
    return sum + (p ? p.price * l.qty : 0)
  }, 0)

  for (const line of order.lines) {
    const target = productById(line.productId)
    if (!target) continue
    const isHero = target.hero ?? false
    const oos = shelf.outOfStock.has(target.id)
    const lineValue = target.price * line.qty

    if (!oos) {
      retained += lineValue
      lines.push(outcome(line, target, null))
      continue
    }

    events.push({
      orderIdx,
      orderId: order.id,
      kind: "oos",
      productId: target.id,
      productName: `${target.brand} ${target.name}`,
      isHero,
    })

    if (policy === "auto-refund") {
      refunded += lineValue
      heroLost = heroLost || isHero
      const complaint = rng.chance(isHero ? 0.35 : 0.1)
      if (complaint) complaints++
      events.push(refundEvent(line, target))
      lines.push(outcome(line, target, { kind: "refunded", complaint }))
      continue
    }

    if (policy === "naive-sub") {
      const pick = naiveSubstitute(target, shelf)
      if (!pick) {
        refunded += lineValue
        heroLost = heroLost || isHero
        const complaint = rng.chance(isHero ? 0.35 : 0.1)
        if (complaint) complaints++
        events.push(refundEvent(line, target))
        lines.push(outcome(line, target, { kind: "refunded", complaint }))
        continue
      }
      const violated = violatesCustomerProfile(pick.product, order.profile)
      const priceDelta = pick.product.price - target.price
      const uplift = Math.max(0, priceDelta / target.price)
      const pAccept = violated ? 0.18 : Math.max(0.2, 0.55 - uplift * 0.5)
      const accepted = rng.chance(pAccept)
      const complaint = rng.chance(accepted ? (violated ? 0.75 : 0.12) : 0.55)
      if (complaint) complaints++
      if (accepted) {
        retained += pick.product.price * line.qty
      } else {
        refunded += lineValue
        wasted++
        heroLost = heroLost || isHero
      }
      events.push(subEvent(line, target, pick.product, accepted, Math.round(pAccept * 100)))
      lines.push(
        outcome(line, target, {
          kind: "substituted",
          accepted,
          candidate: {
            product: pick.product,
            score: Math.round(pAccept * 100),
            reasons: [
              {
                kind: "popularity",
                label: violated ? "⚠ Ignores basket profile" : "Popular pick",
              },
            ],
            priceDelta,
            pAccept,
          },
          complaint,
        }),
      )
      continue
    }

    // policy === "swap-smart"
    const { candidates } = rankSubstitutes(target, order, shelf, {
      priceUpliftCap: DEFAULT_PRICE_UPLIFT_CAP,
    })
    const best = candidates[0]
    if (!best) {
      // no safe substitute exists — honest refund, identical to baseline here
      refunded += lineValue
      heroLost = heroLost || isHero
      const complaint = rng.chance(isHero ? 0.35 : 0.1)
      if (complaint) complaints++
      events.push(refundEvent(line, target))
      lines.push(outcome(line, target, { kind: "refunded", complaint }))
      continue
    }
    const accepted = rng.chance(best.pAccept)
    if (accepted) {
      retained += best.product.price * line.qty
    } else {
      refunded += lineValue
      wasted++
      heroLost = heroLost || isHero
    }
    const complaint = rng.chance(accepted ? 0.02 : 0.3)
    if (complaint) complaints++
    events.push(subEvent(line, target, best.product, accepted, best.score))
    lines.push(outcome(line, target, { kind: "substituted", accepted, candidate: best, complaint }))
  }

  // a lost hero item tips the whole order into cancellation: everything picked
  // goes back to the shelf, the full basket is refunded, revenue is zero.
  let cancelled = false
  if (heroLost && order.lines.length <= 8 && rng.chance(0.2)) {
    cancelled = true
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i]
      if (!l) continue
      if (!l.oos) wasted++
      l.retainedEur = 0
      l.wastedItem = l.wastedItem || !l.oos
      l.refundedEur = l.target.price * l.line.qty
    }
    retained = 0
    refunded = basketValue
    events.push({
      orderIdx,
      orderId: order.id,
      kind: "order-cancelled",
      productId: "",
      productName: "",
      isHero: true,
    })
  }

  function outcome(
    line: OrderLine,
    target: Product,
    decision:
      | { kind: "refunded"; complaint: boolean }
      | { kind: "substituted"; accepted: boolean; candidate: SubstituteCandidate; complaint: boolean }
      | null,
  ): LineOutcome {
    const isHero = target.hero ?? false
    const lineValue = target.price * line.qty
    const oos = decision !== null
    return {
      order,
      line,
      target,
      isHero,
      oos,
      decision:
        decision === null
          ? null
          : decision.kind === "refunded"
            ? { kind: "refunded", blocked: [] }
            : { kind: "substituted", accepted: decision.accepted, candidate: decision.candidate },
      retainedEur:
        decision === null
          ? lineValue
          : decision.kind === "substituted" && decision.accepted
            ? decision.candidate.product.price * line.qty
            : 0,
      refundedEur:
        decision?.kind === "refunded" || (decision?.kind === "substituted" && !decision.accepted)
          ? lineValue
          : 0,
      complaint: decision?.complaint ?? false,
      wastedItem: decision?.kind === "substituted" ? !decision.accepted : false,
      pickerSeconds: decision !== null ? MODELS[policy].decisionSeconds : 0,
    }
  }

  function refundEvent(line: OrderLine, target: Product): SimEvent {
    return {
      orderIdx,
      orderId: order.id,
      kind: "refund",
      productId: line.productId,
      productName: `${target.brand} ${target.name}`,
      isHero: target.hero ?? false,
    }
  }

  function subEvent(line: OrderLine, target: Product, sub: Product, accepted: boolean, score: number): SimEvent {
    return {
      orderIdx,
      orderId: order.id,
      kind: accepted ? "sub-accepted" : "sub-rejected",
      productId: line.productId,
      productName: `${target.brand} ${target.name}`,
      subId: sub.id,
      subName: `${sub.brand} ${sub.name}`,
      score,
      isHero: target.hero ?? false,
    }
  }

  return {
    order,
    lines,
    basketValueEur: basketValue,
    retainedEur: retained,
    refundedEur: refunded,
    cancelled,
    complaint: complaints > 0,
    wastedItems: wasted,
    pickerSeconds: lines.reduce((s, l) => s + l.pickerSeconds, 0),
  }
}

function computeKpis(_policy: Policy, outcomes: OrderOutcome[]): Kpis {
  let oosLines = 0
  let subsOffered = 0
  let subsAccepted = 0
  let refunds = 0
  let retained = 0
  let refunded = 0
  let basket = 0
  let cancelled = 0
  let complaints = 0
  let waste = 0
  let pickerSeconds = 0

  for (const o of outcomes) {
    for (const l of o.lines) {
      if (l.oos) {
        oosLines++
        if (l.decision?.kind === "substituted") {
          subsOffered++
          if (l.decision.accepted) subsAccepted++
        } else {
          refunds++
        }
      }
      retained += l.retainedEur
      refunded += l.refundedEur
      if (l.complaint) complaints++
      if (l.wastedItem) waste++
      pickerSeconds += l.pickerSeconds
    }
    basket += o.basketValueEur
    if (o.cancelled) cancelled++
  }

  const orders = outcomes.length
  const perOrderRetained = orders > 0 ? retained / orders : 0

  return {
    orders,
    oosLines,
    subsOffered,
    subsAccepted,
    acceptanceRate: subsOffered > 0 ? subsAccepted / subsOffered : 0,
    refunds,
    refundRate: oosLines > 0 ? refunds / oosLines : 0,
    basketValueEur: basket,
    retainedEur: retained,
    refundedEur: refunded,
    cancelledOrders: cancelled,
    complaints,
    complaintsPer1k: orders > 0 ? (complaints / orders) * 1000 : 0,
    foodWasteItems: waste,
    pickerMinutes: pickerSeconds / 60,
    netImpactEurPerMonth: perOrderRetained * ORDERS_PER_DAY * DAYS_PER_MONTH,
  }
}

export interface ImpactSummary {
  retainedDeltaEurPerMonth: number
  refundsAvoidedPerMonth: number
  refundHandlingSavingsEurPerMonth: number
  netImpactEurPerMonth: number
  ordersSavedPerMonth: number
  complaintsAvoidedPerMonth: number
  pickerHoursSavedPerMonth: number
  wasteItemsAvoidedPerMonth: number
}

/** Business impact of moving from `from` to `to`, projected at 350 orders/day. */
export function impactSummary(sim: Simulation, from: Policy = "auto-refund", to: Policy = "swap-smart"): ImpactSummary {
  const a = policyResult(sim, from)
  const b = policyResult(sim, to)
  const scale = (ORDERS_PER_DAY * DAYS_PER_MONTH) / Math.max(1, sim.config.orders)

  const retainedDelta = b.kpis.retainedEur - a.kpis.retainedEur
  const refundsAvoided = a.kpis.refunds - b.kpis.refunds
  const ordersSaved = a.kpis.cancelledOrders - b.kpis.cancelledOrders
  const complaintsAvoided = a.kpis.complaints - b.kpis.complaints
  const pickerSecondsSaved = a.kpis.pickerMinutes * 60 - b.kpis.pickerMinutes * 60
  const wasteAvoided = a.kpis.foodWasteItems - b.kpis.foodWasteItems

  const refundSavings = refundsAvoided * REFUND_HANDLING_EUR
  return {
    retainedDeltaEurPerMonth: retainedDelta * scale,
    refundsAvoidedPerMonth: refundsAvoided * scale,
    refundHandlingSavingsEurPerMonth: refundSavings * scale,
    netImpactEurPerMonth: (retainedDelta + refundSavings) * scale,
    ordersSavedPerMonth: ordersSaved * scale,
    complaintsAvoidedPerMonth: complaintsAvoided * scale,
    pickerHoursSavedPerMonth: (pickerSecondsSaved / 3600) * scale,
    wasteItemsAvoidedPerMonth: wasteAvoided * scale,
  }
}

export function policyResult(sim: Simulation, policy: Policy): PolicyResult {
  switch (policy) {
    case "auto-refund":
      return sim.autoRefund
    case "naive-sub":
      return sim.naive
    case "swap-smart":
      return sim.smart
  }
}

function hashPolicy(policy: Policy): number {
  // stable, distinct seed offsets per policy so streams never correlate
  switch (policy) {
    case "auto-refund":
      return 0x11111111
    case "naive-sub":
      return 0x22222222
    case "swap-smart":
      return 0x33333333
  }
}
