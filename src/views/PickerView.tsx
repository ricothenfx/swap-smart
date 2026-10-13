import { useMemo, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import {
  productById,
  rankSubstitutes,
  swapMessage,
  type BlockedCandidate,
  type Locale,
  type Order,
  type OrderLine,
  type Product,
  type ShelfState,
  type SubstituteCandidate,
} from "../engine"
import { writeMessage, type WrittenMessage } from "../ai/writer"
import { useApp } from "../state/store"
import { PhoneFrame } from "../components/PhoneFrame"
import { ReasonChip } from "../components/ReasonChip"

const STORE = { name: "FrischDepot Kreuzberg", zone: "Berlin · fictional demo store" }

type LineStatus = "pending" | "picked" | "substituted" | "refunded"

interface OosMoment {
  line: OrderLine
  target: Product
  candidates: SubstituteCandidate[]
  blocked: BlockedCandidate[]
  /** system said in stock, but the picker cannot find it — phantom stock */
  phantom: boolean
  chosen?: SubstituteCandidate
}

const LOCALE_TABS: { code: Locale; label: string }[] = [
  { code: "en", label: "EN" },
  { code: "de", label: "DE" },
  { code: "id", label: "ID" },
]

export function PickerView() {
  const { sim } = useApp()
  const [orderIdx, setOrderIdx] = useState(0)
  const [phase, setPhase] = useState<"queue" | "picking" | "summary">("queue")
  const [statuses, setStatuses] = useState<Record<number, LineStatus>>({})
  const [oos, setOos] = useState<OosMoment | null>(null)
  const [thinking, setThinking] = useState(false)
  const [message, setMessage] = useState<WrittenMessage | null>(null)
  const [locale, setLocale] = useState<Locale>("en")
  const [stats, setStats] = useState({ subs: 0, retainedEur: 0, refunds: 0, phantoms: 0 })
  const [swaps, setSwaps] = useState<Record<string, SubstituteCandidate>>({})
  const [shiftDone, setShiftDone] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const orders = useMemo(() => sim.orders.slice(0, 8), [sim])
  const order: Order | undefined = orders[orderIdx]

  const lines = useMemo(
    () =>
      (order?.lines ?? [])
        .map((l) => ({ line: l, product: productById(l.productId) }))
        .filter((x): x is { line: OrderLine; product: Product } => x.product !== undefined)
        .sort(
          (a, b) =>
            a.product.zone.localeCompare(b.product.zone) ||
            a.product.name.localeCompare(b.product.name),
        ),
    [order],
  )

  const pickedCount = lines.filter((_, i) => statuses[i] === "picked" || statuses[i] === "substituted").length

  function startOrder(i: number) {
    if (i >= orders.length) {
      setShiftDone(true)
      setPhase("queue")
      return
    }
    setOrderIdx(i)
    setStatuses({})
    setPhase("picking")
  }

  function advance(next: Record<number, LineStatus>) {
    const anyPending = lines.some((_, i) => (next[i] ?? "pending") === "pending")
    if (!anyPending) setPhase("summary")
  }

  function pickLine(idx: number) {
    if (phase !== "picking" || oos) return
    if ((statuses[idx] ?? "pending") !== "pending") return
    if (!lines[idx]) return
    const next = { ...statuses, [idx]: "picked" as const }
    setStatuses(next)
    advance(next)
  }

  function reportMissing(idx: number) {
    if (phase !== "picking" || oos) return
    if ((statuses[idx] ?? "pending") !== "pending") return
    const entry = lines[idx]
    if (!entry || !order) return
    const phantom = !sim.shelf.outOfStock.has(entry.product.id)
    const { candidates, blocked } = rankSubstitutes(entry.product, order, sim.shelf)
    setOos({ line: entry.line, target: entry.product, candidates, blocked, phantom })
    if (phantom) setStats((s) => ({ ...s, phantoms: s.phantoms + 1 }))
    setThinking(true)
    setMessage(null)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setThinking(false), 750)
  }

  function chooseSub(cand: SubstituteCandidate) {
    if (!oos) return
    setOos({ ...oos, chosen: cand })
    const topReason = cand.reasons[0]?.label ?? "best match in stock"
    setMessage({ text: swapMessage({ target: oos.target, sub: cand.product, priceDelta: cand.priceDelta, locale }), source: "template" })
    void writeMessage({
      target: oos.target,
      sub: cand.product,
      priceDelta: cand.priceDelta,
      reason: topReason,
      locale,
    }).then(setMessage)
  }

  function confirmSwap() {
    if (!oos?.chosen) return
    const lineIdx = currentPendingIdx()
    if (lineIdx === -1) return
    const next = { ...statuses, [lineIdx]: "substituted" as const }
    setStatuses(next)
    setSwaps((m) => ({ ...m, [oos.target.id]: oos.chosen! }))
    setStats((s) => ({
      ...s,
      subs: s.subs + 1,
      retainedEur: s.retainedEur + oos.chosen!.product.price * oos.line.qty,
    }))
    closeOos(next)
  }

  function refundLine() {
    if (!oos) return
    const lineIdx = currentPendingIdx()
    const next = { ...statuses, [lineIdx]: "refunded" as const }
    setStatuses(next)
    setStats((s) => ({ ...s, refunds: s.refunds + 1 }))
    closeOos(next)
  }

  function currentPendingIdx(): number {
    return lines.findIndex((_, i) => (statuses[i] ?? "pending") === "pending")
  }

  function closeOos(next: Record<number, LineStatus>) {
    setOos(null)
    setMessage(null)
    const anyPending = lines.some((_, i) => (next[i] ?? "pending") === "pending")
    if (!anyPending) setPhase("summary")
  }

  return (
    <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)] gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_auto]">
      <aside className="order-2 max-w-xl lg:order-1">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent">Picker App</p>
        <h1 className="mt-2 text-4xl font-extrabold tracking-tight">
          The 5-second shelf decision,
          <br />
          <span className="text-accent">made right.</span>
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-muted">
          A picker finds <strong className="text-ink">Alpenhof Whole Milk</strong> missing from A1.
          Today that means a refund — the basket loses money, the customer gets a bad email.
          Swap-Smart ranks safe substitutes against <em>this</em> customer's basket and lets the
          picker confirm in one tap.
        </p>
        <ul className="mt-6 space-y-3 text-sm">
          {[
            ["Hard rules first", "out-of-stock, allergens, diet, ±25% price guardrail, same category — AI can never cross them"],
            ["Explainable ranking", "every card shows its reasons: name match, price delta, diet fit, popularity"],
            ["Human confirms", "the engine suggests, the picker decides — same pattern as the CSV mapper in Prep-Truth"],
          ].map(([t, d]) => (
            <li key={t} className="flex gap-3">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" />
              <span>
                <strong className="font-semibold">{t}.</strong>{" "}
                <span className="text-muted">{d}</span>
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Orders picked" value={String(orderIdx + (phase === "summary" ? 1 : 0)) + " / " + orders.length} />
          <Stat label="Smart swaps" value={String(stats.subs)} />
          <Stat label="Basket kept" value={"€" + stats.retainedEur.toFixed(2)} />
          <Stat label="Phantom flags" value={String(stats.phantoms)} />
        </div>

        <div className="mt-8 rounded-2xl border border-line bg-surface p-4 text-xs leading-relaxed text-muted shadow-card">
          <strong className="text-ink">Everything is live.</strong> The shelf state, the baskets and
          the ranking all come from the same seeded simulation as the Ops Deck (seed{" "}
          <code className="font-mono text-accent">{useSeedLabel()}</code>). In the phone, report each
          item the way a real picker would: <strong className="text-ink">✓ Found it</strong> packs the
          line; <strong className="text-ink">✗ Can't find it</strong> hands it to the engine. The
          pick list walks the store zone by zone, like a real pick path.
        </div>

        <div className="mt-3 rounded-2xl border border-line bg-surface p-4 text-xs leading-relaxed text-muted shadow-card">
          <strong className="text-ink">Phantom stock, modeled.</strong> The handheld never sees the
          shelf truth — you do, standing at the slot. When an item the system calls in-stock can't
          be found, it is flagged as a <em>phantom stock</em> event (cycle-count territory) and the
          substitution engine takes over immediately — no wandering the aisle, no silent refund.
        </div>
      </aside>

      <div className="order-1 lg:order-2">
        <PhoneFrame label={`${STORE.name} · picker handheld`}>
          <div className="relative min-h-full">
            <div className="flex items-center justify-between border-b border-line bg-surface px-4 py-3">
              <div>
                <p className="text-[13px] font-bold">{STORE.name}</p>
                <p className="text-[10px] uppercase tracking-widest text-muted">{STORE.zone}</p>
              </div>
              <span className="chip !text-accent">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" /> on shift
              </span>
            </div>

            <AnimatePresence mode="wait">
              {phase === "queue" && (
                <motion.div key="queue" {...fade}>
                  <QueueView
                    orders={orders}
                    shiftDone={shiftDone && orderIdx >= orders.length - 1}
                    current={orderIdx}
                    onStart={() => startOrder(shiftDone ? 0 : orderIdx)}
                  />
                </motion.div>
              )}
              {phase === "picking" && order && (
                <motion.div key={"pick-" + orderIdx} {...fade}>
                  <PickList
                    order={order}
                    lines={lines}
                    statuses={statuses}
                    progress={pickedCount / Math.max(1, lines.length)}
                    shelf={sim.shelf}
                    onFound={pickLine}
                    onMissing={reportMissing}
                  />
                </motion.div>
              )}
              {phase === "summary" && order && (
                <motion.div key="summary" {...fade}>
                  <OrderSummary
                    order={order}
                    lines={lines}
                    statuses={statuses}
                    swaps={swaps}
                    onNext={() => startOrder(orderIdx + 1)}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* OOS moment overlay */}
            <AnimatePresence>
              {oos && (
                <motion.div
                  data-testid="oos-panel"
                  className="absolute inset-0 z-20 flex flex-col bg-[var(--overlay-bg)] backdrop-blur-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <OosPanel
                    moment={oos}
                    thinking={thinking}
                    message={message}
                    locale={locale}
                    setLocale={(l) => {
                      setLocale(l)
                      if (oos.chosen) {
                        const text = swapMessage({ target: oos.target, sub: oos.chosen.product, priceDelta: oos.chosen.priceDelta, locale: l })
                        setMessage({ text, source: "template" })
                        void writeMessage({ target: oos.target, sub: oos.chosen.product, priceDelta: oos.chosen.priceDelta, reason: oos.chosen.reasons[0]?.label ?? "", locale: l }).then(setMessage)
                      }
                    }}
                    onChoose={chooseSub}
                    onConfirm={confirmSwap}
                    onRefund={refundLine}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </PhoneFrame>
      </div>
    </div>
  )
}

function useSeedLabel(): string {
  const { seed } = useApp()
  return String(seed)
}

const fade = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.22 },
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card px-3 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">{label}</p>
      <p className="kpi-num mt-1 text-xl">{value}</p>
    </div>
  )
}

function QueueView({
  orders,
  current,
  shiftDone,
  onStart,
}: {
  orders: Order[]
  current: number
  shiftDone: boolean
  onStart: () => void
}) {
  return (
    <div className="px-4 py-4">
      <h2 className="text-lg font-extrabold">Pick queue</h2>
      <p className="text-xs text-muted">
        {orders.length} orders waiting · oldest {Math.max(...orders.map((o) => o.ageMinutes))} min
      </p>
      <div className="mt-3 space-y-2.5">
        {orders.slice(0, 5).map((o, i) => (
          <div
            key={o.id}
            className={
              "card flex items-center gap-3 px-3 py-2.5 " + (i === current && !shiftDone ? "!border-accent/60" : "")
            }
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent-soft font-mono text-[11px] font-bold text-accent">
              {o.lines.length}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-mono text-[12px] font-semibold">{o.id}</p>
              <p className="truncate text-[11px] text-muted">
                {heroNames(o)} · {o.ageMinutes} min
              </p>
            </div>
            {i === current && !shiftDone && <span className="chip !border-accent/50 !bg-accent-soft !text-accent">next</span>}
          </div>
        ))}
      </div>
      <button onClick={onStart} className="btn-primary mt-4 w-full !py-3.5 text-base">
        {shiftDone ? "Start new shift" : "Start picking"}
      </button>
      <p className="mt-3 text-center text-[11px] text-muted">
        Shelf is short today — expect missing items. The engine has your back.
      </p>
    </div>
  )
}

function heroNames(o: Order): string {
  const names = o.lines
    .slice(0, 2)
    .map((l) => productById(l.productId)?.name.toLowerCase())
    .filter(Boolean)
  return names.join(", ") + (o.lines.length > 2 ? ` +${o.lines.length - 2}` : "")
}

function PickList({
  order,
  lines,
  statuses,
  progress,
  shelf,
  onFound,
  onMissing,
}: {
  order: Order
  lines: { line: OrderLine; product: Product }[]
  statuses: Record<number, LineStatus>
  progress: number
  shelf: ShelfState
  onFound: (idx: number) => void
  onMissing: (idx: number) => void
}) {
  const currentIdx = lines.findIndex((_, i) => (statuses[i] ?? "pending") === "pending")
  const current = currentIdx >= 0 ? lines[currentIdx] : undefined
  const currentEmpty = current ? shelf.outOfStock.has(current.product.id) : false
  return (
    <div className="px-4 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-mono text-[13px] font-bold">{order.id}</h2>
          <p className="text-[11px] text-muted">
            {order.lines.length} items
            {order.profile.diet !== "mixed" && (
              <span className="ml-1.5 font-semibold text-accent">· {dietLabel(order.profile.diet)} household</span>
            )}
          </p>
        </div>
        <span className="kpi-num text-sm text-muted">
          {lines.filter((_, i) => (statuses[i] ?? "pending") !== "pending").length}/{lines.length}
        </span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2">
        <motion.div
          className="h-full rounded-full bg-accent"
          animate={{ width: `${Math.round(progress * 100)}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
        />
      </div>

      <div className="mt-3 space-y-2">
        {lines.map((entry, i) => {
          const status = statuses[i] ?? "pending"
          const isCurrent = i === currentIdx && status === "pending"
          return (
            <motion.div
              key={entry.line.productId + i}
              data-current={isCurrent ? "true" : undefined}
              data-testid={isCurrent ? "current-line" : undefined}
              className={
                "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors " +
                (status === "pending"
                  ? isCurrent
                    ? "border-accent/60 bg-accent-soft/60"
                    : "border-line bg-surface opacity-80"
                  : "border-line bg-surface-2 opacity-55")
              }
            >
              <span className="chip w-9 justify-center !px-0 font-mono">{entry.product.zone}</span>
              <span className="min-w-0 flex-1">
                <span className={"block truncate text-[13px] font-semibold " + (status !== "pending" ? "line-through" : "")}>
                  {entry.product.name}
                </span>
                <span className="block truncate text-[11px] text-muted">
                  {entry.product.brand} · {entry.product.size} · €{entry.product.price.toFixed(2)}
                </span>
              </span>
              <span className="font-mono text-[13px] font-bold">×{entry.line.qty}</span>
              <StatusIcon status={status} />
            </motion.div>
          )
        })}
      </div>

      {current && (
        <div className="mt-3 rounded-2xl border border-line bg-surface p-3 shadow-card">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted">
              At slot {current.product.zone} · you see
            </span>
            <span
              data-testid="slot-view"
              className={
                "chip !text-[10px] " +
                (currentEmpty ? "!border-warn/60 !bg-warn-soft !text-warn" : "!border-accent/50 !bg-accent-soft !text-accent")
              }
            >
              {currentEmpty ? "slot is empty" : "item on the shelf"}
            </span>
          </div>
          <div className="mt-2.5 grid grid-cols-2 gap-2">
            <button onClick={() => onFound(currentIdx)} className="btn-primary !py-3 text-[13px]">
              ✓ Found it
            </button>
            <button
              onClick={() => onMissing(currentIdx)}
              data-testid="cant-find"
              className="btn-ghost !py-3 text-[13px] !border-bad/50 !text-bad"
            >
              ✗ Can't find it
            </button>
          </div>
          <p className="mt-2 text-center text-[11px] text-muted">
            Report what the shelf shows — the system doesn't always agree.
          </p>
        </div>
      )}
    </div>
  )
}

function dietLabel(diet: Order["profile"]["diet"]): string {
  switch (diet) {
    case "vegan":
      return "vegan"
    case "lactose-free":
      return "lactose-free"
    case "nut-allergy":
      return "nut-allergy"
    default:
      return "mixed"
  }
}

function StatusIcon({ status }: { status: LineStatus }) {
  if (status === "pending") return <span className="h-5 w-5 rounded-full border-2 border-line" />
  if (status === "picked")
    return (
      <motion.span initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="grid h-5 w-5 place-items-center rounded-full bg-accent text-accent-ink">
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 6.5 5 9l5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </motion.span>
    )
  if (status === "substituted")
    return (
      <motion.span initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="grid h-5 w-5 place-items-center rounded-full bg-accent text-accent-ink" title="substituted">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M4 8h13l-3.2-3.2M20 16H7l3.2 3.2" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </motion.span>
    )
  return (
    <motion.span initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="grid h-5 w-5 place-items-center rounded-full bg-bad-soft font-bold text-bad" title="refunded">
      ×
    </motion.span>
  )
}

function OrderSummary({
  order,
  lines,
  statuses,
  swaps,
  onNext,
}: {
  order: Order
  lines: { line: OrderLine; product: Product }[]
  statuses: Record<number, LineStatus>
  swaps: Record<string, SubstituteCandidate>
  onNext: () => void
}) {
  const subs = lines.filter((_, i) => statuses[i] === "substituted")
  const refunds = lines.filter((_, i) => statuses[i] === "refunded")
  const kept = subs.reduce((s, x) => s + x.product.price * x.line.qty, 0)
  return (
    <div className="px-4 py-6 text-center">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 18 }}
        className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-accent text-accent-ink"
      >
        <svg width="28" height="28" viewBox="0 0 12 12" fill="none"><path d="M2 6.5 5 9l5-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </motion.div>
      <h2 className="mt-3 text-lg font-extrabold">Order done</h2>
      <p className="font-mono text-[11px] text-muted">{order.id}</p>
      <div className="mt-4 grid grid-cols-3 gap-2 text-left">
        <div className="card px-2.5 py-2">
          <p className="text-[9px] font-bold uppercase tracking-wider text-muted">Swaps</p>
          <p className="kpi-num text-lg">{subs.length}</p>
        </div>
        <div className="card px-2.5 py-2">
          <p className="text-[9px] font-bold uppercase tracking-wider text-muted">Refunds</p>
          <p className="kpi-num text-lg">{refunds.length}</p>
        </div>
        <div className="card px-2.5 py-2">
          <p className="text-[9px] font-bold uppercase tracking-wider text-muted">Kept</p>
          <p className="kpi-num text-lg text-accent">€{kept.toFixed(2)}</p>
        </div>
      </div>
      {subs.length > 0 && (
        <div className="mt-3 space-y-1.5 text-left">
          {subs.map((x) => {
            const sub = swaps[x.line.productId]
            return (
              <div key={x.line.productId} className="card px-3 py-2 text-[11px] leading-snug">
                <span className="text-muted">{x.product.brand} {x.product.name} →</span>{" "}
                <span className="font-semibold text-accent">
                  {sub ? `${sub.product.brand} ${sub.product.name}` : "substituted"}
                </span>
                {sub && <span className="ml-1 text-muted">({sub.score})</span>}
              </div>
            )
          })}
        </div>
      )}
      <button onClick={onNext} className="btn-primary mt-5 w-full !py-3">
        Next order →
      </button>
    </div>
  )
}

function OosPanel({
  moment,
  thinking,
  message,
  locale,
  setLocale,
  onChoose,
  onConfirm,
  onRefund,
}: {
  moment: OosMoment
  thinking: boolean
  message: WrittenMessage | null
  locale: Locale
  setLocale: (l: Locale) => void
  onChoose: (c: SubstituteCandidate) => void
  onConfirm: () => void
  onRefund: () => void
}) {
  const [showWhy, setShowWhy] = useState<string | null>(null)
  const t = moment.target
  const phantom = moment.phantom

  return (
    <div className="flex h-full flex-col overflow-y-auto scroll-thin px-4 py-4">
      {/* target card with stamp */}
      <div
        className={
          "relative overflow-hidden rounded-2xl border px-4 py-3 " +
          (phantom ? "border-warn/50 bg-warn-soft" : "border-bad/50 bg-bad-soft")
        }
      >
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
          {phantom ? "Inventory mismatch · zone " + t.zone : "Not on shelf · zone " + t.zone}
        </p>
        <p className="text-[15px] font-extrabold">{t.name}</p>
        <p className="text-[11px] text-muted">{t.brand} · {t.size} · €{t.price.toFixed(2)}</p>
        <motion.span
          initial={{ scale: 2.2, opacity: 0, rotate: -18 }}
          animate={{ scale: 1, opacity: 1, rotate: -8 }}
          transition={{ type: "spring", stiffness: 320, damping: 16 }}
          className={
            "absolute right-2 top-2 rounded-lg border-2 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest " +
            (phantom ? "border-warn text-warn" : "border-bad text-bad")
          }
        >
          {phantom ? "phantom stock" : "out of stock"}
        </motion.span>
        {phantom && (
          <p className="mt-1.5 text-[11px] leading-snug text-muted">
            The system said this was in stock — you can't find it. Flagged for cycle count; the
            engine lines up safe swaps.
          </p>
        )}
      </div>

      {/* engine thinking */}
      <AnimatePresence mode="wait">
        {thinking ? (
          <motion.div key="think" {...fade} className="mt-3 flex items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2.5">
            <motion.span
              className="h-2 w-2 rounded-full bg-accent"
              animate={{ scale: [1, 1.6, 1] }}
              transition={{ repeat: Infinity, duration: 0.7 }}
            />
            <motion.span
              className="h-2 w-2 rounded-full bg-accent"
              animate={{ scale: [1, 1.6, 1] }}
              transition={{ repeat: Infinity, duration: 0.7, delay: 0.15 }}
            />
            <motion.span
              className="h-2 w-2 rounded-full bg-accent"
              animate={{ scale: [1, 1.6, 1] }}
              transition={{ repeat: Infinity, duration: 0.7, delay: 0.3 }}
            />
            <span className="ml-1 text-[12px] font-medium text-muted">Matching against the shelf…</span>
          </motion.div>
        ) : moment.chosen ? (
          <motion.div key="msg" {...fade} className="mt-3">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-wider text-accent">Customer message</p>
              <div className="flex gap-1">
                {LOCALE_TABS.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => setLocale(l.code)}
                    className={
                      "rounded-lg px-2 py-1 text-[11px] font-bold " +
                      (locale === l.code ? "bg-accent text-accent-ink" : "bg-surface-2 text-muted")
                    }
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
            <motion.div
              initial={{ opacity: 0, y: 14, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
              className="mt-2 rounded-2xl rounded-bl-md border border-line bg-surface px-3.5 py-3 text-[13px] leading-relaxed shadow-card"
            >
              {message?.text}
            </motion.div>
            <div className="mt-1.5 flex items-center justify-between">
              <span className="chip">{message?.source === "ai" ? "✦ AI-polished" : "Template · replay mode"}</span>
              <button onClick={onConfirm} className="btn-primary !py-2">
                Send & continue
              </button>
            </div>
          </motion.div>
        ) : moment.candidates.length > 0 ? (
          <motion.div key="cands" {...fade} className="mt-3 space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted">
              Engine suggestions · {moment.blocked.length} blocked by hard rules
            </p>
            {moment.candidates.slice(0, 3).map((c, i) => (
              <CandidateCard
                key={c.product.id}
                cand={c}
                rank={i + 1}
                showWhy={showWhy === c.product.id}
                onToggleWhy={() => setShowWhy(showWhy === c.product.id ? null : c.product.id)}
                onChoose={() => onChoose(c)}
              />
            ))}
            <button onClick={onRefund} className="btn-ghost mt-1 w-full !py-2.5 text-[13px]">
              None fits — refund this item
            </button>
          </motion.div>
        ) : (
          <motion.div key="none" {...fade} className="mt-3 rounded-xl border border-line bg-surface px-3 py-3 text-[13px]">
            <p className="font-semibold">No safe substitute in this category.</p>
            <p className="mt-1 text-[12px] text-muted">
              All alternatives are blocked by hard rules (stock, allergens, diet, price guardrail).
              An honest refund is the right call — the engine knows when not to suggest.
            </p>
            <button onClick={onRefund} className="btn-ghost mt-2 w-full !py-2.5">
              Refund item
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function CandidateCard({
  cand,
  rank,
  showWhy,
  onToggleWhy,
  onChoose,
}: {
  cand: SubstituteCandidate
  rank: number
  showWhy: boolean
  onToggleWhy: () => void
  onChoose: () => void
}) {
  const p = cand.product
  return (
    <motion.div
      initial={{ opacity: 0, x: 42 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.08 * rank, type: "spring", stiffness: 320, damping: 26 }}
      className={
        "rounded-2xl border bg-surface p-3 shadow-card " +
        (rank === 1 ? "border-accent/60" : "border-line")
      }
    >
      <div className="flex items-center gap-2.5">
        <ScoreRing score={cand.score} rank={rank} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-extrabold">{p.name}</p>
          <p className="truncate text-[11px] text-muted">
            {p.brand} · {p.size} ·{" "}
            <span className={cand.priceDelta <= 0 ? "font-semibold text-accent" : "font-semibold text-warn"}>
              {cand.priceDelta < -0.005
                ? `€${Math.abs(cand.priceDelta).toFixed(2)} cheaper`
                : cand.priceDelta > 0.005
                  ? `+€${cand.priceDelta.toFixed(2)}`
                  : "same price"}
            </span>
          </p>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {cand.reasons.map((r, i) => (
          <ReasonChip key={r.kind + r.label} reason={r} index={i} />
        ))}
      </div>
      <div className="mt-2.5 flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
          <motion.div
            className="h-full bg-accent"
            initial={{ width: 0 }}
            animate={{ width: `${Math.round(cand.pAccept * 100)}%` }}
            transition={{ delay: 0.3, duration: 0.5 }}
          />
        </div>
        <span className="tnum text-[10px] font-bold text-muted">
          ~{Math.round(cand.pAccept * 100)}% accept
        </span>
      </div>
      <div className="mt-2.5 flex gap-2">
        <button onClick={onChoose} className="btn-primary flex-1 !py-2 text-[13px]">
          {rank === 1 ? "Swap with this" : "Use this"}
        </button>
        <button onClick={onToggleWhy} className="btn-ghost !px-3 !py-2 text-[12px]">
          {showWhy ? "Hide" : "Why?"}
        </button>
      </div>
      <AnimatePresence>
        {showWhy && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-2 rounded-xl bg-surface-2 px-3 py-2 text-[11px] leading-relaxed text-muted">
              <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-ink">Score breakdown</p>
              <p className="mt-1">
                score <span className="font-mono font-bold text-accent">{cand.score}</span> = semantic match + price
                proximity + diet fit (this basket: <span className="font-semibold">{cand.product.dietTags.includes("vegan") ? "vegan ✓" : "no constraint"}</span>)
                + popularity + same shelf row + rating.
              </p>
              <p className="mt-1">
                Hard rules already removed {""}
                <span className="font-semibold text-ink">everything unsafe</span> before scoring: out of stock, allergens,
                diet, &gt;25% price, cross-category.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function ScoreRing({ score, rank }: { score: number; rank: number }) {
  const r = 15
  const c = 2 * Math.PI * r
  return (
    <div className="relative h-11 w-11 shrink-0">
      <svg width="44" height="44" viewBox="0 0 44 44" className="-rotate-90">
        <circle cx="22" cy="22" r={r} fill="none" stroke="var(--surface-2)" strokeWidth="4" />
        <motion.circle
          cx="22"
          cy="22"
          r={r}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - score / 100) }}
          transition={{ delay: 0.2, duration: 0.7, ease: "easeOut" }}
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center">
        <span className={"kpi-num text-[11px] " + (rank === 1 ? "text-accent" : "text-ink")}>{score}</span>
      </span>
    </div>
  )
}
