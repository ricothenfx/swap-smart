import { impactSummary } from "../engine"
import { useApp } from "../state/store"

const euro = (n: number) => "€" + Math.round(n).toLocaleString("en-IE")

export function StoryView() {
  const { sim, setTab } = useApp()
  const impact = useMemoImpact(sim)
  const smart = sim.smart.kpis
  const naive = sim.naive.kpis
  const base = sim.autoRefund.kpis

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent">The problem</p>
      <h1 className="mt-2 text-4xl font-extrabold tracking-tight">
        In q-commerce, the most expensive decision
        <br />
        is made in 5 seconds, in a hallway.
      </h1>
      <p className="mt-4 text-[15px] leading-relaxed text-muted">
        Dark stores promise 15-minute delivery. But the system's inventory and the shelf disagree
        constantly — around <strong className="text-ink">8% of lines</strong> are missing at pick
        time. When a picker hits an empty slot, today's default is a refund email: the basket loses
        the item, the customer loses the dinner plan, support gets a ticket. And when the missing
        item is milk, eggs or bread, the whole order often dies with it.
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <MiniStat big={(base.refundRate * 100).toFixed(0) + "%"} label="of missing items become refunds under the status quo" />
        <MiniStat big={String(base.cancelledOrders)} label={"orders fully cancelled per " + sim.config.orders + " — a hero item was lost"} tone="bad" />
        <MiniStat big={base.complaintsPer1k.toFixed(0)} label="complaint events per 1,000 orders" tone="warn" />
      </div>

      <p className="mt-10 text-[11px] font-bold uppercase tracking-[0.2em] text-accent">The solution</p>
      <h2 className="mt-2 text-2xl font-extrabold tracking-tight">
        Swap-Smart turns the empty slot into a one-tap, explainable swap.
      </h2>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <Step n="1" title="Hard rules first" body="In stock · allergen-safe · diet-safe · ≤25% price uplift · same category. Non-negotiable, non-AI. Everything unsafe is removed before any scoring happens." />
        <Step n="2" title="Explainable ranking" body="Semantic match (synonym-aware TF-IDF), price proximity, diet fit with the rest of the basket, popularity, rating — every card shows its reasons as chips." />
        <Step n="3" title="Human confirms" body="The engine suggests, the picker decides, the customer gets an honest multilingual note. AI never decides alone — the same discipline as the deterministic engines in this portfolio." />
      </div>

      <p className="mt-10 text-[11px] font-bold uppercase tracking-[0.2em] text-accent">The proof</p>
      <h2 className="mt-2 text-2xl font-extrabold tracking-tight">
        Same {sim.config.orders} orders, same shelf, three policies.
      </h2>
      <div className="mt-4 overflow-hidden rounded-2xl border border-line">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="bg-surface-2 text-left text-[11px] uppercase tracking-wider text-muted">
              <th className="px-3 py-2.5 font-bold">KPI</th>
              <th className="px-3 py-2.5 text-right font-bold">Auto-refund</th>
              <th className="px-3 py-2.5 text-right font-bold">Naive bot</th>
              <th className="px-3 py-2.5 text-right font-bold text-accent">Swap-Smart</th>
            </tr>
          </thead>
          <tbody className="bg-surface">
            {(
              [
                ["Swap acceptance", "—", pct(naive.acceptanceRate), pct(smart.acceptanceRate)],
                ["Missing items refunded", pct(base.refundRate), pct(naive.refundRate), pct(smart.refundRate)],
                ["Basket retained", euro(base.retainedEur), euro(naive.retainedEur), euro(smart.retainedEur)],
                ["Orders cancelled", String(base.cancelledOrders), String(naive.cancelledOrders), String(smart.cancelledOrders)],
                ["Complaints / 1k", base.complaintsPer1k.toFixed(0), naive.complaintsPer1k.toFixed(0), smart.complaintsPer1k.toFixed(0)],
                ["Rejected swaps → waste", String(base.foodWasteItems), String(naive.foodWasteItems), String(smart.foodWasteItems)],
                ["Picker time", base.pickerMinutes.toFixed(0) + " min", naive.pickerMinutes.toFixed(0) + " min", smart.pickerMinutes.toFixed(0) + " min"],
              ] as const
            ).map(([label, a, b, c]) => (
              <tr key={label} className="border-t border-line/60">
                <td className="px-3 py-2 text-muted">{label}</td>
                <td className="px-3 py-2 text-right kpi-num">{a}</td>
                <td className="px-3 py-2 text-right kpi-num">{b}</td>
                <td className="px-3 py-2 text-right kpi-num font-bold text-accent">{c}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <MiniStat big={euro(impact.retainedDeltaEurPerMonth / (sim.config.orders / 1000))} label="extra basket value per 1,000 orders" tone="good" />
        <MiniStat big={euro(impact.netImpactEurPerMonth)} label="net per month at 350 orders/day, incl. €2.50 saved per avoided refund" tone="good" />
        <MiniStat big={"-" + Math.round((1 - smart.complaintsPer1k / base.complaintsPer1k) * 100) + "%"} label="complaint events vs status quo" tone="good" />
      </div>

      <p className="mt-10 text-[11px] font-bold uppercase tracking-[0.2em] text-accent">The honesty section</p>
      <div className="card mt-2 p-5 text-[13.5px] leading-relaxed">
        <p>
          <strong>These are simulated numbers — reproducible, not claimed.</strong> The catalog is
          synthetic (fictional Berlin brands), the baskets and shelf drift come from a seeded
          generator, and the acceptance model is a published formula, not a neural net. Fixed seed{" "}
          <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-accent">{sim.config.seed}</code>{" "}
          → byte-identical KPIs, exportable as JSON from the Ops Deck.
        </p>
        <table className="mt-4 w-full text-[12.5px]">
          <thead>
            <tr className="text-left text-[10.5px] uppercase tracking-wider text-muted">
              <th className="py-1.5">Assumption</th>
              <th className="py-1.5 text-right">Value</th>
              <th className="py-1.5 text-right">Anchor</th>
            </tr>
          </thead>
          <tbody className="align-top">
            {(
              [
                ["Item missing at pick time", "8% of lines, popularity-weighted", "industry range 5–10% for online-grocery picking"],
                ["Full cancellation after losing a hero item", "20% of affected baskets ≤ 8 lines", "assumption, adjustable in code"],
                ["Acceptance of a good in-person swap", "formula of score & price uplift", "online-grocery substitution studies report ~50% acceptance for naive swaps"],
                ["Refund handling cost", "€2.50 per refund", "support ticket + payment reversal benchmark"],
                ["Store volume for projections", "350 orders/day", "mid-size q-commerce hub"],
              ] as const
            ).map(([a, v, s]) => (
              <tr key={a} className="border-t border-line/60">
                <td className="py-2 pr-3 text-muted">{a}</td>
                <td className="py-2 pr-3 text-right font-semibold">{v}</td>
                <td className="py-2 text-right text-[11.5px] text-muted">{s}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-10 text-[11px] font-bold uppercase tracking-[0.2em] text-accent">Where the AI is</p>
      <div className="mt-2 grid gap-3 sm:grid-cols-3">
        <Step n="✓" title="Semantic matching" body="Synonym-aware TF-IDF similarity makes “whole milk” meet “full-cream” and “oat drink” meet “Haferdrink” — deterministic, in-browser, inspectable." />
        <Step n="✓" title="Basket inference" body="Diet constraints and price sensitivity are inferred from the rest of the basket — the reason a vegan basket is never offered dairy." />
        <Step n="✓" title="Word choice only" body="The optional LLM (serverless, key-gated) polishes the customer note in EN/DE/ID. No key? Templates carry the demo. The engine never depends on the model." />
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <button className="btn-primary" onClick={() => setTab("picker")}>
          Try the picker flow
        </button>
        <button className="btn-ghost" onClick={() => setTab("ops")}>
          Open the Ops Deck
        </button>
      </div>
    </div>
  )
}

function useMemoImpact(sim: Parameters<typeof impactSummary>[0]) {
  return impactSummary(sim)
}

function pct(v: number): string {
  return v > 0 ? (v * 100).toFixed(1) + "%" : "—"
}

function MiniStat({ big, label, tone }: { big: string; label: string; tone?: "good" | "bad" | "warn" }) {
  const color = tone === "good" ? "text-accent" : tone === "bad" ? "text-bad" : tone === "warn" ? "text-warn" : ""
  return (
    <div className="card px-4 py-4">
      <p className={"kpi-num text-3xl " + color}>{big}</p>
      <p className="mt-1 text-[12px] leading-snug text-muted">{label}</p>
    </div>
  )
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="card p-4">
      <span className="grid h-7 w-7 place-items-center rounded-lg bg-accent-soft font-mono text-[12px] font-bold text-accent">
        {n}
      </span>
      <p className="mt-2 font-bold">{title}</p>
      <p className="mt-1 text-[12.5px] leading-relaxed text-muted">{body}</p>
    </div>
  )
}
