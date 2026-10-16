import {
  createContext,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import {
  productById,
  rankSubstitutes,
  swapMessage,
  type BlockedCandidate,
  type Locale,
  type Order,
  type OrderLine,
  type Product,
  type SubstituteCandidate,
} from "../engine"
import { writeMessage, type WrittenMessage } from "../ai/writer"
import { useApp } from "../state/store"

export type LineStatus = "pending" | "picked" | "substituted" | "refunded"

export interface OosMoment {
  line: OrderLine
  target: Product
  candidates: SubstituteCandidate[]
  blocked: BlockedCandidate[]
  /** system said in stock, but the picker cannot find it — phantom stock */
  phantom: boolean
  chosen?: SubstituteCandidate
}

/** UI events a native shell can hook (haptics, sounds). No-op on web. */
export type PickerEvent = "found" | "oos" | "confirm" | "refund"

interface PickerSessionState {
  orders: Order[]
  order: Order | undefined
  lines: { line: OrderLine; product: Product }[]
  orderIdx: number
  phase: "queue" | "picking" | "summary"
  statuses: Record<number, LineStatus>
  oos: OosMoment | null
  thinking: boolean
  message: WrittenMessage | null
  locale: Locale
  stats: { subs: number; retainedEur: number; refunds: number; phantoms: number }
  swaps: Record<string, SubstituteCandidate>
  shiftDone: boolean
  pickedCount: number
  startOrder: (i: number) => void
  pickLine: (idx: number) => void
  reportMissing: (idx: number) => void
  chooseSub: (cand: SubstituteCandidate) => void
  confirmSwap: () => void
  refundLine: () => void
  /** switch the customer-message language; regenerates the message when one is on screen */
  changeLocale: (l: Locale) => void
}

const Ctx = createContext<PickerSessionState | null>(null)

export function PickerSessionProvider({
  children,
  onEvent,
}: {
  children: ReactNode
  onEvent?: (e: PickerEvent) => void
}) {
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
    onEvent?.("found")
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
    onEvent?.("oos")
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
    onEvent?.("confirm")
    closeOos(next)
  }

  function refundLine() {
    if (!oos) return
    const lineIdx = currentPendingIdx()
    const next = { ...statuses, [lineIdx]: "refunded" as const }
    setStatuses(next)
    setStats((s) => ({ ...s, refunds: s.refunds + 1 }))
    onEvent?.("refund")
    closeOos(next)
  }

  function currentPendingIdx(): number {
    return lines.findIndex((_, i) => (statuses[i] ?? "pending") === "pending")
  }

  function changeLocale(l: Locale) {
    setLocale(l)
    if (oos?.chosen) {
      const chosen = oos.chosen
      setMessage({
        text: swapMessage({ target: oos.target, sub: chosen.product, priceDelta: chosen.priceDelta, locale: l }),
        source: "template",
      })
      void writeMessage({
        target: oos.target,
        sub: chosen.product,
        priceDelta: chosen.priceDelta,
        reason: chosen.reasons[0]?.label ?? "",
        locale: l,
      }).then(setMessage)
    }
  }

  function closeOos(next: Record<number, LineStatus>) {
    setOos(null)
    setMessage(null)
    const anyPending = lines.some((_, i) => (next[i] ?? "pending") === "pending")
    if (!anyPending) setPhase("summary")
  }

  const value: PickerSessionState = {
    orders,
    order,
    lines,
    orderIdx,
    phase,
    statuses,
    oos,
    thinking,
    message,
    locale,
    stats,
    swaps,
    shiftDone,
    pickedCount,
    startOrder,
    pickLine,
    reportMissing,
    chooseSub,
    confirmSwap,
    refundLine,
    changeLocale,
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function usePickerSession(): PickerSessionState {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error("usePickerSession outside PickerSessionProvider")
  return ctx
}
