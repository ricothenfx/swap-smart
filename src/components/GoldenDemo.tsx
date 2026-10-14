import { useEffect, useMemo, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import {
  impactSummary,
  productById,
  rankSubstitutes,
  swapMessage,
} from "../engine"
import { useApp } from "../state/store"
import { ProductTile } from "./ProductTile"
import { ReasonChip } from "./ReasonChip"

/**
 * Golden Demo — a narrated, auto-playing tour over the real seeded simulation.
 * No script data: every card and number comes from the same engine.
 */

const STEP_SECONDS = 6

export function GoldenDemo() {
  const { demoOpen, setDemoOpen, sim, setTab } = useApp()

  const hero = useMemo(() => {
    // the first accepted swap with a decent score, from the real sim
    const ev = sim.smart.events.find((e) => e.kind === "sub-accepted" && (e.score ?? 0) >= 60)
    if (!ev) return null
    const order = sim.orders.find((o) => o.id === ev.orderId)
    const target = productById(ev.productId)
    if (!order || !target) return null
    const { candidates } = rankSubstitutes(target, order, sim.shelf)
    const cand = candidates.find((c) => c.product.id === ev.subId) ?? candidates[0]
    if (!cand) return null
    return { ev, order, target, cand }
  }, [sim])

  const steps: { title: string; body: string; render: () => React.ReactNode }[] = useMemo(() => {
    const impact = impactSummary(sim)
    const smart = sim.smart.kpis
    const naive = sim.naive.kpis
    return [
      {
        title: "Friday, 17:42. Pick aisle A1.",
        body: "A dark store in Berlin. 340 orders in the queue, and the shelf disagrees with the app's inventory.",
        render: () => <Big number={String(smart.oosLines)} label={`items missing on this shift (seed ${sim.config.seed})`} />,
      },
      {
        title: "The milk is gone.",
        body: hero
          ? `${hero.target.brand} ${hero.target.name} — a basket hero. Today: a refund email and an empty dinner table.`
          : "A hero item is missing from the shelf.",
        render: () =>
          hero ? (
            <Card>
              <div className="flex items-center gap-3">
                <ProductTile product={hero.target} size="lg" />
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">not on shelf · zone {hero.target.zone}</p>
                  <p className="text-lg font-extrabold leading-tight">{hero.target.name}</p>
                  <p className="text-xs text-muted">{hero.target.brand} · €{hero.target.price.toFixed(2)}</p>
                </div>
              </div>
            </Card>
          ) : null,
      },
      {
        title: "Swap-Smart answers in one tap.",
        body: hero
          ? `${hero.cand.product.brand} ${hero.cand.product.name} — score ${hero.cand.score}. The picker sees the reasons and confirms.`
          : "A ranked, explainable suggestion.",
        render: () =>
          hero ? (
            <Card>
              <div className="flex items-center gap-2.5">
                <ProductTile product={hero.cand.product} size="sm" />
                <p className="min-w-0 flex-1 truncate font-extrabold">{hero.cand.product.brand} {hero.cand.product.name}</p>
                <span className="kpi-num text-accent">{hero.cand.score}</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {hero.cand.reasons.map((r, i) => (
                  <ReasonChip key={r.kind + r.label} reason={r} index={i} />
                ))}
              </div>
            </Card>
          ) : null,
      },
      {
        title: "The customer knows. In their language.",
        body: "An honest note: what changed, what it costs, refund at the door if they disagree. Templates in EN/DE/ID; an optional LLM only polishes wording.",
        render: () =>
          hero ? (
            <Card>
              <p className="rounded-xl bg-surface-2 px-3 py-2.5 text-[12.5px] leading-relaxed">
                {swapMessage({ target: hero.target, sub: hero.cand.product, priceDelta: hero.cand.priceDelta, locale: "en" })}
              </p>
            </Card>
          ) : null,
      },
      {
        title: "Same shelf, three policies.",
        body: `Naive popularity matching accepts ${pct(naive.acceptanceRate)} and complains a lot. Auto-refund keeps nothing. Swap-Smart accepts ${pct(smart.acceptanceRate)}.`,
        render: () => (
          <div className="grid grid-cols-3 gap-2">
            <Mini label="auto-refund" v="0%" sub="acceptance" muted />
            <Mini label="naive bot" v={pct(naive.acceptanceRate)} sub="acceptance" />
            <Mini label="swap-smart" v={pct(smart.acceptanceRate)} sub="acceptance" accent />
          </div>
        ),
      },
      {
        title: "What it's worth.",
        body: "Projected at 350 orders/day for one store, including €2.50 saved per avoided refund.",
        render: () => (
          <div className="grid grid-cols-2 gap-2">
            <Mini label="basket retained" v={"€" + Math.round(((sim.smart.kpis.retainedEur - sim.autoRefund.kpis.retainedEur) / sim.config.orders) * 1000).toLocaleString()} sub="per 1,000 orders" accent />
            <Mini label="net / month / store" v={"€" + Math.round(impact.netImpactEurPerMonth).toLocaleString()} sub="350 orders/day" accent />
            <Mini label="orders saved" v={Math.round(impact.ordersSavedPerMonth).toLocaleString()} sub="per month" />
            <Mini label="picker hours" v={Math.round(impact.pickerHoursSavedPerMonth) + " h"} sub="per month" />
          </div>
        ),
      },
      {
        title: "Every number reproducible.",
        body: `Seed ${sim.config.seed}, ${sim.config.orders} orders → byte-identical KPIs, exportable JSON. Try it yourself: the Picker for feel, the Ops Deck for proof.`,
        render: () => null,
      },
    ]
  }, [sim, hero])

  const [step, setStep] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (!demoOpen || paused) return
    if (step >= steps.length - 1) return
    const t = setTimeout(() => setStep((s) => s + 1), STEP_SECONDS * 1000)
    return () => clearTimeout(t)
  }, [demoOpen, step, paused, steps.length])

  useEffect(() => {
    if (demoOpen) {
      setStep(0)
      setPaused(false)
    }
  }, [demoOpen])

  if (!demoOpen) return null
  const current = steps[step]

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/55 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Golden demo"
      onClick={() => setDemoOpen(false)}
    >
      <motion.div
        initial={{ scale: 0.94, y: 16, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 26 }}
        className="w-full max-w-lg rounded-3xl border border-line bg-surface p-6 shadow-pop"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <span className="chip !border-accent/50 !bg-accent-soft !text-accent">▶ Golden Demo</span>
          <span className="tnum text-[11px] font-bold text-muted">
            {step + 1} / {steps.length}
          </span>
        </div>

        <div className="mt-3 h-1 overflow-hidden rounded-full bg-surface-2">
          <motion.div
            key={step + String(paused)}
            className="h-full bg-accent"
            initial={{ width: "0%" }}
            animate={paused ? { width: "0%" } : { width: "100%" }}
            transition={{ duration: STEP_SECONDS, ease: "linear" }}
          />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.28 }}
          >
            <h3 className="mt-4 text-xl font-extrabold tracking-tight">{current?.title}</h3>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted">{current?.body}</p>
            <div className="mt-4 min-h-[110px]">{current?.render()}</div>
          </motion.div>
        </AnimatePresence>

        <div className="mt-5 flex items-center gap-2">
          <button
            className="btn-ghost !px-3 !py-2 text-[12px]"
            onClick={() => setPaused((p) => !p)}
          >
            {paused ? "▶" : "❚❚"}
          </button>
          <button
            className="btn-ghost !px-3 !py-2 text-[12px]"
            onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))}
          >
            Next
          </button>
          <div className="ml-auto flex gap-2">
            <button
              className="btn-ghost !py-2 text-[12px]"
              onClick={() => {
                setDemoOpen(false)
                setTab(step >= 4 ? "ops" : "picker")
              }}
            >
              {step >= 4 ? "Open Ops Deck" : "Try it live"}
            </button>
            <button className="btn-primary !py-2 text-[12px]" onClick={() => setDemoOpen(false)}>
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

function Big({ number, label }: { number: string; label: string }) {
  return (
    <div className="text-center">
      <p className="kpi-num text-5xl text-accent">{number}</p>
      <p className="mt-1 text-[12px] text-muted">{label}</p>
    </div>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-line bg-background p-4">{children}</div>
}

function Mini({
  label,
  v,
  sub,
  accent,
  muted,
}: {
  label: string
  v: string
  sub: string
  accent?: boolean
  muted?: boolean
}) {
  return (
    <div className={"rounded-xl border px-3 py-2.5 " + (accent ? "border-accent/50 bg-accent-soft" : "border-line bg-background")}>
      <p className="text-[9.5px] font-bold uppercase tracking-wider text-muted">{label}</p>
      <p className={"kpi-num mt-0.5 text-lg " + (muted ? "text-muted" : accent ? "text-accent" : "")}>{v}</p>
      <p className="text-[9.5px] text-muted">{sub}</p>
    </div>
  )
}

function pct(v: number): string {
  return (v * 100).toFixed(1) + "%"
}
