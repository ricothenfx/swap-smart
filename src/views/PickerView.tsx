import { useApp } from "../state/store"
import { PhoneFrame } from "../components/PhoneFrame"
import { Hint, HintIcon } from "../components/Hint"
import { PickerSessionProvider, usePickerSession } from "./PickerSession"
import { PickerHandheld } from "./PickerHandheld"

const STORE = { name: "FrischDepot Kreuzberg", zone: "Berlin · fictional demo store" }

export function PickerView() {
  return (
    <PickerSessionProvider>
      <PickerPage />
    </PickerSessionProvider>
  )
}

function PickerPage() {
  const { seed } = useApp()
  const { orders, orderIdx, phase, stats } = usePickerSession()

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
          <Stat
            label="Orders picked"
            value={String(orderIdx + (phase === "summary" ? 1 : 0)) + " / " + orders.length}
            hint="Orders finished this shift. The demo shift runs 8 seeded orders — restart the page to reset."
          />
          <Stat
            label="Smart swaps"
            value={String(stats.subs)}
            hint="Lines kept with a confirmed substitute instead of a refund — each one is basket value saved."
          />
          <Stat
            label="Basket kept"
            value={"€" + stats.retainedEur.toFixed(2)}
            hint="€ value kept in customers' baskets through swaps. Under today's auto-refund flow this money walks out with the refund email."
          />
          <Stat
            label="Phantom flags"
            value={String(stats.phantoms)}
            hint="Items the system called in-stock but the shelf was empty. Each flag is a cycle-count event — the store learns where its inventory lies."
          />
        </div>
        <p className="mt-2 text-[11px] text-muted">
          Hover any number or chip to see what it means.
        </p>

        <div className="mt-8 rounded-2xl border border-line bg-surface p-4 text-xs leading-relaxed text-muted shadow-card">
          <strong className="text-ink">Everything is live.</strong> The shelf state, the baskets and
          the ranking all come from the same seeded simulation as the Ops Deck (seed{" "}
          <code className="font-mono text-accent">{seed}</code>). In the phone, report each
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
          <PickerHandheld />
        </PhoneFrame>
      </div>
    </div>
  )
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="card px-3 py-3">
      <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted">
        {label}
        {hint && (
          <Hint tip={hint}>
            <HintIcon />
          </Hint>
        )}
      </p>
      <p className="kpi-num mt-1 text-xl">{value}</p>
    </div>
  )
}
