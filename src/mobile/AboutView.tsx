import { Capacitor } from "@capacitor/core"
import { Browser } from "@capacitor/browser"
import { impactSummary } from "../engine"
import { useApp } from "../state/store"

const SITE = "https://swap-smart.ricothen.com"

export function AboutView() {
  const { sim, theme, toggleTheme } = useApp()
  const naive = sim.naive.kpis
  const smart = sim.smart.kpis
  const impact = impactSummary(sim)
  const basket = smart.basketValueEur

  return (
    <div className="h-full overflow-y-auto scroll-thin px-4 py-5">
      <div className="mx-auto max-w-md">
        {/* brand */}
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-accent text-accent-ink">
            <SwapIcon />
          </span>
          <div>
            <h1 className="text-lg font-extrabold leading-tight">Swap-Smart</h1>
            <p className="text-[11px] uppercase tracking-widest text-muted">
              one-tap substitution for dark stores
            </p>
          </div>
          <button
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            className="btn-ghost ml-auto !rounded-xl !px-2.5 !py-2"
          >
            {theme === "dark" ? "☀" : "☾"}
          </button>
        </div>

        <p className="mt-4 text-[13px] leading-relaxed text-muted">
          Roughly <strong className="text-ink">8% of lines</strong> are missing at pick time in
          q-commerce. Today's default is an automatic refund: the basket loses the item, the
          customer gets a bad email. Swap-Smart ranks safe substitutes against{" "}
          <em>this</em> customer's basket — hard rules first, explainable score, picker confirms in
          one tap.
        </p>

        {/* proof */}
        <h2 className="mt-6 text-[11px] font-bold uppercase tracking-[0.18em] text-accent">
          The proof — simulated, reproducible
        </h2>
        <p className="mt-1 text-[11px] text-muted">
          Seed {sim.config.seed} · {smart.orders.toLocaleString("en-US")} orders · identical shelf
          for all policies
        </p>
        <div className="card mt-3 divide-y divide-line overflow-hidden">
          <KpiRow label="Swap acceptance" naive={pct(naive.acceptanceRate)} smart={pct(smart.acceptanceRate)} />
          <KpiRow
            label={"Basket retained (of €" + Math.round(basket).toLocaleString("en-US") + ")"}
            naive={"€" + Math.round(naive.retainedEur).toLocaleString("en-US")}
            smart={"€" + Math.round(smart.retainedEur).toLocaleString("en-US")}
          />
          <KpiRow
            label="Orders cancelled (hero lost)"
            naive={String(naive.cancelledOrders)}
            smart={String(smart.cancelledOrders)}
          />
          <KpiRow
            label="Complaints per 1,000 orders"
            naive={String(Math.round(naive.complaintsPer1k))}
            smart={String(Math.round(smart.complaintsPer1k))}
          />
          <KpiRow
            label="Rejected swaps → waste items"
            naive={String(naive.foodWasteItems)}
            smart={String(smart.foodWasteItems)}
          />
        </div>
        <p className="mt-1.5 text-[10px] text-muted">
          Columns: naive popularity bot vs Swap-Smart. Same numbers as the Ops Deck on the website.
        </p>

        <div className="card mt-3 bg-accent-soft !border-accent/40 px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-accent">
            vs auto-refund, projected at 350 orders/day per store
          </p>
          <p className="kpi-num mt-1 text-2xl text-accent">
            +€{Math.round(impact.netImpactEurPerMonth).toLocaleString("en-US")}
          </p>
          <p className="text-[11px] text-muted">
            net per month/store — basket value kept + €2.50 saved per avoided refund,{" "}
            {Math.round(impact.pickerHoursSavedPerMonth).toLocaleString("en-US")} picker-hours saved
            per month.
          </p>
        </div>

        {/* hard rules */}
        <h2 className="mt-6 text-[11px] font-bold uppercase tracking-[0.18em] text-accent">
          Hard rules — non-negotiable, non-AI
        </h2>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {["in stock", "allergen-safe", "diet-safe", "≤25% price uplift", "same category"].map((r) => (
            <span key={r} className="chip">
              {r}
            </span>
          ))}
        </div>
        <p className="mt-2 text-[12px] leading-relaxed text-muted">
          The ranking is a transparent formula (semantic match, price, diet fit, popularity,
          rating) — every chip on a suggestion card is a reason. The optional AI only words the
          customer message; without a key, templates carry the flow.
        </p>

        {/* honesty */}
        <h2 className="mt-6 text-[11px] font-bold uppercase tracking-[0.18em] text-accent">Honesty</h2>
        <p className="mt-2 text-[12px] leading-relaxed text-muted">
          All data is synthetic — fictional Berlin brands, no real products. Numbers are simulated
          and reproducible: fixed seed, byte-identical KPIs, asserted by tests. Assumptions (8% OOS
          rate, 20% hero-loss cancellation, €2.50 refund handling) are listed on the website.
        </p>

        <button
          onClick={() => {
            void openSite()
          }}
          className="btn-ghost mt-6 w-full !py-3 text-[13px]"
        >
          Full story, Ops Deck & Q&A ↗
        </button>
        <p className="mt-4 pb-4 text-center text-[10px] text-muted">
          swap-smart.ricothen.com · portfolio engineering by Rico
        </p>
      </div>
    </div>
  )
}

function KpiRow({ label, naive, smart }: { label: string; naive: string; smart: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5">
      <span className="min-w-0 flex-1 text-[12px] font-medium">{label}</span>
      <span className="tnum w-16 text-right text-[12px] text-muted">{naive}</span>
      <span className="tnum w-16 text-right text-[12px] font-bold text-accent">{smart}</span>
    </div>
  )
}

function pct(x: number): string {
  return (x * 100).toFixed(1) + "%"
}

async function openSite(): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    try {
      await Browser.open({ url: SITE })
      return
    } catch {
      // fall through to window.open
    }
  }
  window.open(SITE, "_blank", "noopener")
}

function SwapIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 8h13l-3.2-3.2M20 16H7l3.2 3.2"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
