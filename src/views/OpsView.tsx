import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import {
  CATALOG,
  CATEGORIES,
  impactSummary,
  policyResult,
  rankSubstitutes,
  type Category,
  type CustomerProfile,
  type Policy,
  type Simulation,
} from "../engine"
import { useApp } from "../state/store"
import { ProductTile } from "../components/ProductTile"
import { ReasonChip } from "../components/ReasonChip"

const euro = (n: number) => "€" + Math.round(n).toLocaleString("en-IE")

export function OpsView() {
  const { sim, seed, setSeed, orderCount, setOrderCount } = useApp()
  const impact = useMemo(() => impactSummary(sim), [sim])
  const vsNaive = useMemo(() => impactSummary(sim, "naive-sub", "swap-smart"), [sim])

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Ops Deck</h1>
          <p className="text-xs text-muted">Same shelf, same orders — three policies compete.</p>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <label className="chip !py-2">
            seed
            <input
              type="number"
              value={seed}
              onChange={(e) => setSeed(Number(e.target.value) || 0)}
              className="w-20 bg-transparent font-mono font-bold text-ink outline-none"
              aria-label="simulation seed"
            />
          </label>
          <label className="chip !py-2">
            orders
            <select
              value={orderCount}
              onChange={(e) => setOrderCount(Number(e.target.value))}
              className="bg-transparent font-mono font-bold text-ink outline-none"
              aria-label="order count"
            >
              {[250, 500, 1000, 2000].map((n) => (
                <option key={n} value={n} className="text-ink">
                  {n}
                </option>
              ))}
            </select>
          </label>
          <button
            className="btn-ghost !py-2"
            onClick={() => {
              const payload = {
                config: sim.config,
                assumptions: {
                  refundHandlingEur: 2.5,
                  ordersPerDay: 350,
                  daysPerMonth: 30,
                },
                autoRefund: sim.autoRefund.kpis,
                naive: sim.naive.kpis,
                swapSmart: sim.smart.kpis,
                impactVsAutoRefundPerMonth: impact,
                impactVsNaivePerMonth: vsNaive,
              }
              const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" })
              const a = document.createElement("a")
              a.href = URL.createObjectURL(blob)
              a.download = `swap-smart-seed${seed}-${orderCount}.json`
              a.click()
              URL.revokeObjectURL(a.href)
            }}
          >
            ↓ Export JSON
          </button>
        </div>
      </div>

      <ImpactStrip sim={sim} />
      <PolicyCards sim={sim} />
      <TwinReplay sim={sim} />
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <AcceptanceHistogram sim={sim} />
        <Explorer sim={sim} />
      </div>
    </div>
  )
}

/* ---------------- impact strip ---------------- */

function ImpactStrip({ sim }: { sim: Simulation }) {
  const impact = useMemo(() => impactSummary(sim), [sim])
  // per-1,000-orders deltas come straight from the raw KPIs (impactSummary is
  // already projected to a 30-day month at 350 orders/day — never mix the two)
  const scale1k = 1000 / Math.max(1, sim.config.orders)
  const retainedPer1k = (sim.smart.kpis.retainedEur - sim.autoRefund.kpis.retainedEur) * scale1k
  const ordersSavedPer1k = (sim.autoRefund.kpis.cancelledOrders - sim.smart.kpis.cancelledOrders) * scale1k
  const complaintsPer1k = sim.autoRefund.kpis.complaintsPer1k - sim.smart.kpis.complaintsPer1k
  const items = [
    {
      label: "Basket retained",
      value: euro(retainedPer1k),
      unit: "per 1,000 orders",
      hint: "revenue that stays in baskets instead of refund emails",
    },
    {
      label: "Orders saved",
      value: Math.round(ordersSavedPer1k).toString(),
      unit: "per 1,000 orders",
      hint: "hero item missing no longer kills the whole basket",
    },
    {
      label: "Complaints avoided",
      value: Math.round(complaintsPer1k).toString(),
      unit: "per 1,000 orders",
      hint: "fewer “why did you refund my milk?” tickets",
    },
    {
      label: "Picker time saved",
      value: Math.round(impact.pickerHoursSavedPerMonth) + " h",
      unit: "per month / store",
      hint: "45 s of back-and-forth becomes one 6 s tap",
    },
    {
      label: "Net impact",
      value: euro(impact.netImpactEurPerMonth),
      unit: "per month · 350 orders/day",
      hint: "retained value + €2.50 refund-handling saved per avoided refund",
    },
  ]
  return (
    <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-5">
      {items.map((it, i) => (
        <motion.div
          key={it.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className={"card px-4 py-4 " + (i === items.length - 1 ? "col-span-2 !border-accent/50 lg:col-span-1" : "")}
          title={it.hint}
        >
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted">{it.label}</p>
          <p className={"kpi-num mt-1.5 text-2xl " + (i === items.length - 1 ? "text-accent" : "")}>
            {it.value}
          </p>
          <p className="mt-0.5 text-[10px] text-muted">{it.unit}</p>
        </motion.div>
      ))}
    </div>
  )
}

/* ---------------- policy cards ---------------- */

function PolicyCards({ sim }: { sim: Simulation }) {
  const cards: {
    id: Policy
    title: string
    tagline: string
    highlight?: boolean
  }[] = [
    { id: "auto-refund", title: "Auto-refund", tagline: "status quo: missing → refund email" },
    { id: "naive-sub", title: "Naive bot", tagline: "most popular item, blind to the customer" },
    { id: "swap-smart", title: "Swap-Smart", tagline: "explainable suggestion, picker confirms", highlight: true },
  ]
  return (
    <div className="mt-4 grid gap-3 md:grid-cols-3">
      {cards.map((c) => (
        <PolicyCard key={c.id} sim={sim} policy={c.id} title={c.title} tagline={c.tagline} highlight={c.highlight} />
      ))}
    </div>
  )
}

function PolicyCard({
  sim,
  policy,
  title,
  tagline,
  highlight,
}: {
  sim: Simulation
  policy: Policy
  title: string
  tagline: string
  highlight?: boolean
}) {
  const k = policyResult(sim, policy).kpis
  const rows: [string, string, string?][] = [
    ["Swap acceptance", k.subsOffered ? (k.acceptanceRate * 100).toFixed(1) + "%" : "—", k.subsOffered ? `${k.subsAccepted}/${k.subsOffered}` : "no offers"],
    ["OOS lines refunded", (k.refundRate * 100).toFixed(1) + "%", `${k.refunds}/${k.oosLines}`],
    ["Basket retained", euro(k.retainedEur), "of " + euro(k.basketValueEur)],
    ["Orders cancelled", String(k.cancelledOrders), "hero item lost"],
    ["Complaints / 1k", k.complaintsPer1k.toFixed(0), ""],
    ["Food waste items", String(k.foodWasteItems), ""],
    ["Picker time", k.pickerMinutes.toFixed(0) + " min", "for " + k.oosLines + " OOS decisions"],
  ]
  return (
    <div className={"card p-4 " + (highlight ? "!border-accent/60 shadow-pop" : "")}>
      <div className="flex items-center justify-between">
        <div>
          <p className="font-extrabold">{title}</p>
          <p className="text-[11px] text-muted">{tagline}</p>
        </div>
        {highlight && <span className="chip !border-accent/50 !bg-accent-soft !text-accent">engine</span>}
      </div>
      <table className="mt-3 w-full text-[12.5px]">
        <tbody>
          {rows.map(([label, value, sub]) => (
            <tr key={label} className="border-t border-line/60">
              <td className="py-1.5 pr-2 text-muted">{label}</td>
              <td className="py-1.5 text-right">
                <span className="kpi-num">{value}</span>
                {sub && <span className="ml-1.5 text-[10px] text-muted">{sub}</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ---------------- twin replay ---------------- */

function TwinReplay({ sim }: { sim: Simulation }) {
  const [pinned, setPinned] = useState<number | null>(null)
  const [playing, setPlaying] = useState(false)
  const base = sim.autoRefund.events.filter((e) => e.kind !== "order-cancelled")
  const smart = sim.smart.events.filter((e) => e.kind !== "order-cancelled")
  const count = Math.min(140, base.length, smart.length)

  const colors: Record<"oos" | "refund" | "sub-accepted" | "sub-rejected", string> = {
    oos: "var(--muted)",
    refund: "var(--bad)",
    "sub-accepted": "var(--good)",
    "sub-rejected": "var(--warn)",
  }

  const details = pinned !== null ? { base: base[pinned], smart: smart[pinned] } : null

  return (
    <div className="card mt-4 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <div>
          <h2 className="font-extrabold">Twin replay</h2>
          <p className="text-[11px] text-muted">
            The same {count} shelf moments, two policies. Hover a column, click to pin.
          </p>
        </div>
        <button className="btn-ghost ml-auto !py-2" onClick={() => setPlaying((p) => !p)}>
          {playing ? "❚❚ Pause" : "▶ Replay"}
        </button>
      </div>

      <div className="relative mt-3 space-y-1.5 overflow-hidden">
        <Track label="auto-refund" events={base.slice(0, count)} colors={colors} onPin={setPinned} pinned={pinned} />
        <Track label="swap-smart" events={smart.slice(0, count)} colors={colors} onPin={setPinned} pinned={pinned} />
        {playing && (
          <motion.div
            className="pointer-events-none absolute inset-y-0 left-0 bg-background/0"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 7, ease: "linear" }}
            onAnimationComplete={() => setPlaying(false)}
            style={{
              backgroundImage:
                "linear-gradient(90deg, transparent 0%, transparent 100%)",
              borderRight: "2px solid var(--accent)",
            }}
          />
        )}
      </div>
      <div className="mt-2 flex flex-wrap gap-3 text-[10.5px] text-muted">
        <Legend color={colors["oos"]} label="item missing" />
        <Legend color={colors["refund"]} label="refunded" />
        <Legend color={colors["sub-accepted"]} label="swap accepted" />
        <Legend color={colors["sub-rejected"]} label="swap rejected" />
      </div>

      {details && (
        <div className="mt-3 grid gap-3 rounded-xl border border-line bg-surface-2 p-3 text-[12px] md:grid-cols-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted">auto-refund</p>
            <EventText e={details.base} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted">swap-smart</p>
            <EventText e={details.smart} />
          </div>
        </div>
      )}
    </div>
  )
}

function EventText({ e }: { e: { kind: string; productName: string; subName?: string; score?: number } | undefined }) {
  if (!e) return <p className="text-muted">—</p>
  if (e.kind === "refund") return <p>❌ <strong>{e.productName}</strong> refunded — basket value gone, customer emailed.</p>
  if (e.kind === "sub-accepted")
    return (
      <p>
        ✅ <strong>{e.productName}</strong> → <strong className="text-accent">{e.subName}</strong>{" "}
        {typeof e.score === "number" && <>· score {e.score}</>} — basket kept.
      </p>
    )
  if (e.kind === "sub-rejected")
    return <p>⚠️ <strong>{e.productName}</strong> → {e.subName} rejected at the door.</p>
  return <p>· {e.productName} missing</p>
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-2 w-2 rounded-full" style={{ background: color }} />
      {label}
    </span>
  )
}

function Track({
  label,
  events,
  colors,
  onPin,
  pinned,
}: {
  label: string
  events: { kind: string; orderId: string; productName: string; subName?: string; score?: number; isHero: boolean }[]
  colors: Record<string, string>
  onPin: (i: number | null) => void
  pinned: number | null
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-20 shrink-0 text-right text-[10px] font-bold uppercase tracking-wider text-muted">
        {label}
      </span>
      <div className="flex h-8 flex-1 items-center gap-[3px] overflow-hidden">
        {events.map((e, i) => (
          <button
            key={i}
            className="group relative h-full flex-1 min-w-[4px]"
            style={{ maxWidth: 14 }}
            onMouseEnter={() => onPin(i)}
            onClick={() => onPin(pinned === i ? null : i)}
            aria-label={`${label} event ${i + 1}: ${e.kind} ${e.productName}`}
          >
            <span
              className={
                "block h-2.5 w-full rounded-full transition-transform group-hover:scale-y-150 " +
                (pinned === i ? "ring-2 ring-accent/60" : "")
              }
              style={{ background: colors[e.kind] ?? "var(--line)" }}
            />
          </button>
        ))}
      </div>
    </div>
  )
}

/* ---------------- acceptance histogram ---------------- */

function AcceptanceHistogram({ sim }: { sim: Simulation }) {
  const buckets = useMemo(() => {
    const b = Array.from({ length: 10 }, () => ({ accepted: 0, rejected: 0 }))
    for (const o of sim.smart.orders) {
      for (const l of o.lines) {
        if (l.decision?.kind !== "substituted") continue
        const band = Math.min(9, Math.floor(l.decision.candidate.score / 10))
        const bucket = b[band]
        if (!bucket) continue
        if (l.decision.accepted) bucket.accepted++
        else bucket.rejected++
      }
    }
    return b
  }, [sim])

  const max = Math.max(...buckets.map((b) => b.accepted + b.rejected), 1)
  const w = 460
  const h = 200
  const pad = 34
  const bw = (w - pad * 2) / 10

  return (
    <div className="card p-4">
      <h2 className="font-extrabold">Does the score predict acceptance?</h2>
      <p className="text-[11px] text-muted">
        Swap-Smart outcomes by suggestion score — higher score, higher acceptance. The model is a
        formula, not a black box.
      </p>
      <svg viewBox={`0 0 ${w} ${h + 26}`} className="mt-2 w-full">
        {buckets.map((b, i) => {
          const x = pad + i * bw
          const total = b.accepted + b.rejected
          const hAcc = (b.accepted / max) * (h - pad)
          const hRej = (b.rejected / max) * (h - pad)
          const rate = total > 0 ? Math.round((b.accepted / total) * 100) : null
          return (
            <g key={i}>
              {b.rejected > 0 && (
                <rect x={x + 3} y={h - pad - hAcc - hRej} width={bw - 6} height={hRej} fill="var(--warn)" opacity="0.75" rx="2" />
              )}
              {b.accepted > 0 && (
                <rect x={x + 3} y={h - pad - hAcc} width={bw - 6} height={hAcc} fill="var(--good)" rx="2" />
              )}
              <text x={x + bw / 2} y={h - pad + 14} textAnchor="middle" fontSize="9" fill="var(--muted)">
                {i * 10}–{i * 10 + 9}
              </text>
              {rate !== null && total >= 8 && (
                <text x={x + bw / 2} y={h - pad - hAcc - hRej - 5} textAnchor="middle" fontSize="9" fontWeight="700" fill="var(--ink)">
                  {rate}%
                </text>
              )}
            </g>
          )
        })}
        <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} stroke="var(--line)" />
        <text x={pad} y={h + 16} fontSize="9" fill="var(--muted)">
          suggestion score →
        </text>
        <g transform={`translate(${w - 150}, 8)`}>
          <rect width="10" height="10" fill="var(--good)" rx="2" />
          <text x="14" y="9" fontSize="9" fill="var(--muted)">accepted</text>
          <rect x="70" width="10" height="10" fill="var(--warn)" opacity="0.75" rx="2" />
          <text x="84" y="9" fontSize="9" fill="var(--muted)">rejected at door</text>
        </g>
      </svg>
    </div>
  )
}

/* ---------------- substitution explorer ---------------- */

const PROFILES: { id: CustomerProfile["diet"]; label: string }[] = [
  { id: "mixed", label: "Mixed basket" },
  { id: "vegan", label: "Vegan household" },
  { id: "lactose-free", label: "Lactose-free" },
  { id: "nut-allergy", label: "Nut allergy" },
]

function Explorer({ sim }: { sim: Simulation }) {
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState<Category | "all">("Dairy & Eggs")
  const [productId, setProductId] = useState("d1")
  const [diet, setDiet] = useState<CustomerProfile["diet"]>("mixed")

  const order: CustomerProfile = { diet, priceSensitivity: 0.5 }
  const target = productId ? CATALOG.find((p) => p.id === productId) : undefined

  const list = useMemo(
    () =>
      CATALOG.filter(
        (p) =>
          (category === "all" || p.category === category) &&
          (query.trim() === "" ||
            `${p.brand} ${p.name}`.toLowerCase().includes(query.trim().toLowerCase())),
      ),
    [category, query],
  )

  const result = useMemo(() => {
    if (!target) return null
    const syntheticOrder = {
      id: "EXPLORER",
      profile: order,
      lines: [{ productId: target.id, qty: 1 }],
      ageMinutes: 1,
    }
    return rankSubstitutes(target, syntheticOrder, sim.shelf)
  }, [target, diet, sim.shelf]) // eslint-disable-line react-hooks/exhaustive-deps

  const naivePick = useMemo(() => {
    if (!target) return null
    const pool = CATALOG.filter(
      (p) => p.category === target.category && p.id !== target.id && !sim.shelf.outOfStock.has(p.id),
    ).sort((a, b) => b.popularity - a.popularity)
    return pool[0] ?? null
  }, [target, sim.shelf])

  return (
    <div className="card p-4">
      <h2 className="font-extrabold">Substitution explorer</h2>
      <p className="text-[11px] text-muted">
        The engine, live on any product. Switch the household and watch the hard rules bite.
      </p>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search the shelf…"
            className="w-full rounded-xl border border-line bg-background px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Category | "all")}
            className="mt-2 w-full rounded-xl border border-line bg-background px-3 py-2 text-sm outline-none focus:border-accent"
          >
            <option value="all">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <div className="mt-2 max-h-40 space-y-1 overflow-y-auto scroll-thin pr-1">
            {list.map((p) => (
              <button
                key={p.id}
                onClick={() => setProductId(p.id)}
                className={
                  "flex w-full items-center justify-between rounded-lg border px-2.5 py-1.5 text-left text-[12px] " +
                  (p.id === productId
                    ? "border-accent/60 bg-accent-soft"
                    : "border-line bg-surface hover:bg-surface-2")
                }
              >
                <span className="flex min-w-0 items-center gap-2">
                  <ProductTile product={p} size="xs" />
                  <span className="truncate font-medium">
                    {p.brand} {p.name}
                  </span>
                </span>
                <span className="ml-2 shrink-0 font-mono text-[11px] text-muted">€{p.price.toFixed(2)}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex flex-wrap gap-1.5">
            {PROFILES.map((p) => (
              <button
                key={p.id}
                onClick={() => setDiet(p.id)}
                className={
                  "rounded-lg px-2.5 py-1.5 text-[11px] font-bold " +
                  (diet === p.id ? "bg-accent text-accent-ink" : "bg-surface-2 text-muted hover:text-ink")
                }
              >
                {p.label}
              </button>
            ))}
          </div>

          {target && result && (
            <div className="mt-2.5">
              <div className="flex items-center gap-2">
                <ProductTile product={target} size="sm" />
                <p className="min-w-0 truncate text-[11px] text-muted">
                  <strong className="text-ink">{target.brand} {target.name}</strong> missing · zone {target.zone} ·{" "}
                  {target.allergens.length > 0 ? "allergens: " + target.allergens.join(", ") : "no allergens"}
                </p>
              </div>

              <div className="mt-2 space-y-1.5">
                {result.candidates.slice(0, 3).map((c, i) => (
                  <div key={c.product.id} className="rounded-xl border border-line bg-surface p-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="flex min-w-0 items-center gap-2 truncate text-[12.5px] font-bold">
                        <span className="font-mono text-[10px] text-muted">#{i + 1}</span>
                        <ProductTile product={c.product} size="xs" />
                        <span className="truncate">
                          {c.product.brand} {c.product.name}
                        </span>
                      </p>
                      <span className="kpi-num text-[12px] text-accent">{c.score}</span>
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {c.reasons.map((r, j) => (
                        <ReasonChip key={r.kind + r.label} reason={r} index={j} />
                      ))}
                    </div>
                  </div>
                ))}
                {result.candidates.length === 0 && (
                  <p className="rounded-xl border border-line bg-surface-2 px-3 py-2 text-[12px] text-muted">
                    No safe substitute under the hard rules — an honest refund is correct here.
                  </p>
                )}
              </div>

              {naivePick && (
                <div className="mt-2 rounded-xl border border-warn/40 bg-warn-soft p-2.5 text-[12px]">
                  <p className="font-bold text-warn">What a naive bot ships: {naivePick.brand} {naivePick.name}</p>
                  <p className="mt-0.5 text-[11px] text-muted">
                    popularity-first, blind to {diet !== "mixed" ? diet : "price & fit"}
                    {result.blocked.some((b) => b.product.id === naivePick.id) ? " — and Swap-Smart blocks it." : "."}
                  </p>
                </div>
              )}

              {result.blocked.length > 0 && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-[11px] font-semibold text-muted">
                    {result.blocked.length} blocked candidates — inspect the hard rules
                  </summary>
                  <div className="mt-1.5 max-h-36 space-y-1 overflow-y-auto scroll-thin">
                    {result.blocked.map((b) => (
                      <div key={b.product.id} className="flex items-center justify-between gap-2 rounded-lg bg-surface-2 px-2.5 py-1.5 text-[11px]">
                        <span className="truncate">
                          {b.product.brand} {b.product.name}
                        </span>
                        <span className="shrink-0 text-warn">{b.reason}</span>
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
