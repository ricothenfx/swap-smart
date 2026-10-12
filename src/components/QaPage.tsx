import type { ReactNode } from "react"

interface Qa {
  q: string
  a: ReactNode
}

const NON_TECHNICAL: Qa[] = [
  {
    q: "What does Swap-Smart do, in one sentence?",
    a: (
      <>
        When a dark store picker hits an empty shelf slot, the engine instantly ranks the best
        <em> safe </em>substitute for that exact customer — the picker confirms in one tap instead
        of issuing a refund.
      </>
    ),
  },
  {
    q: "What is a “dark store”, and why should I care about picking?",
    a: (
      <>
        A dark store is a small grocery hub that exists only for fulfilment — no customers walk
        in; everything is picked by staff and delivered in minutes. Picking is where the promise
        is kept or broken, and it is full of tiny decisions. Swap-Smart targets the worst of
        them: the empty slot.
      </>
    ),
  },
  {
    q: "An item is missing — why is that such a big deal?",
    a: (
      <>
        Because it happens constantly and is handled badly. Around 8% of lines are missing at
        pick time (industry range 5–10%), and the default response on many platforms is an
        automatic refund. Worse: when the missing item is a staple — milk, eggs, bread, bananas —
        customers often cancel the whole order. In the reference simulation, 80 of 1,000 orders
        die entirely that way. One missing €1.29 item kills a €30 basket.
      </>
    ),
  },
  {
    q: "What are “hard rules”? Can the AI cross them?",
    a: (
      <>
        Five conditions every suggestion must satisfy before it is ever scored: in stock,
        allergen-safe, diet-safe, at most 25% pricier than the original, same category. They are
        plain code, not AI — safety must be impossible to violate, not unlikely to. Candidates
        that fail are not hidden either: the UI counts them and shows exactly which rule blocked
        each one.
      </>
    ),
  },
  {
    q: "What do the chips on a suggestion card mean?",
    a: (
      <>
        Each chip is a computed reason, not decoration: “94% match” (name similarity),
        “€0.20 cheaper”, “Fits vegan basket”, “Top seller”, “Same shelf row”. The “Why?” button
        on every card opens the full score breakdown. A picker should never have to trust a
        number they can't see the reasoning for.
      </>
    ),
  },
  {
    q: "What does the “~82% accept” estimate mean?",
    a: (
      <>
        It is the engine's estimate that the customer keeps the swap, computed from a published
        formula of suggestion quality and price difference — an honest, well-matched swap shown
        by a person accepts far more often than an anonymous app notification. It is an estimate,
        and it is labelled as one; the Ops Deck histogram shows how well the score actually
        predicts acceptance.
      </>
    ),
  },
  {
    q: "What happens when nothing safe fits?",
    a: (
      <>
        The engine says so and the picker refunds — an honest refund is the right answer when no
        substitute is safe. Knowing when <em>not</em> to suggest is a feature: a naive bot
        always suggests something, which is exactly how butter gets replaced with marzipan.
      </>
    ),
  },
  {
    q: "What does the customer actually see?",
    a: (
      <>
        A short honest note: what was swapped for what, the price difference, and “changed your
        mind? hand it back at the door for an instant refund” — in English, German or
        Indonesian. The message never invents facts; product names and prices are passed through
        from the engine.
      </>
    ),
  },
  {
    q: "Why does the Ops Deck compare three policies?",
    a: (
      <>
        To make the improvement claim fair. The same 1,000 orders meet the same missing shelf
        under three regimes: auto-refund (today's status quo), a naive popularity bot (what a
        shortcut looks like), and Swap-Smart. Comparing against a strawman is easy; comparing
        against both the status quo <em>and</em> the lazy fix is honest. Swap-Smart wins on every
        KPI: 77.9% acceptance, 16 cancelled orders instead of 80, 96 complaints per 1,000
        instead of 278.
      </>
    ),
  },
  {
    q: "Pickers know their shelf. Why give them a tool?",
    a: (
      <>
        Because the decision happens in about five seconds, mid-stride, with no information
        about allergens or the customer's diet — and the refund workaround is slow: 40 seconds of
        form-filling versus one 6-second tap. Over the 1,095 missing items in the reference run,
        that is 730 minutes of picker time under the status quo versus 110 with Swap-Smart.
        Consistency and safety at scale is the second win: every suggestion respects the same
        rules, on the picker's worst day too.
      </>
    ),
  },
  {
    q: "Are the products and numbers real?",
    a: (
      <>
        No — deliberately. The catalog is 90+ fictional Berlin brands (Alpenhof, Kornwerk,
        Grünhof…), and baskets and shelf drift come from a seeded generator. No real products, no
        platform brands, no production data. What <em>is</em> real: the industry assumptions
        (8% out-of-stock, ~50% acceptance for naive swaps) are anchored to published
        online-grocery research and listed with their sources in the honesty section.
      </>
    ),
  },
  {
    q: "Can I check the numbers myself?",
    a: (
      <>
        Yes, two ways. In the browser: Ops Deck → seed <code>2026</code>, orders <code>1000</code>{" "}
        → the exact KPIs from the Story page, byte-identical, exportable as JSON. In the
        terminal: <code>npm test</code> — determinism (same seed ⇒ identical KPIs) is asserted in
        CI, so the numbers can't silently drift.
      </>
    ),
  },
]

const TECHNICAL: Qa[] = [
  {
    q: "What stack is this built with — and why this stack?",
    a: (
      <>
        <strong>Vite + React 18 + TypeScript strict + Tailwind</strong> (design tokens with RGB
        channels so both themes share one source of truth), <strong>framer-motion</strong> for
        micro-interactions, hand-written SVG charts, <strong>Vitest</strong> for engine tests,{" "}
        <strong>Playwright</strong> for e2e, <strong>Vercel</strong> for hosting: a static deploy
        plus one optional serverless function. No router library, no state library, no chart
        library, no database — the domain logic is pure TypeScript functions, so everything else
        stays thin.
      </>
    ),
  },
  {
    q: "Why is the engine fully client-side and deterministic?",
    a: (
      <>
        Three reasons. Proof: every stochastic step goes through a seeded mulberry32 generator —
        seed 2026 produces byte-identical KPIs, which turns “trust me” into “run it yourself”
        (<code>Math.random</code> is banned by the project contract). Resilience: the demo works
        offline and can't die behind a paid API. Scale: a ranking over a few hundred products
        computes in milliseconds — a backend would add latency and ops surface without adding
        decision quality.
      </>
    ),
  },
  {
    q: "How does “semantic” matching work — why TF-IDF and not embeddings?",
    a: (
      <>
        A synonym-aware TF-IDF cosine over tokenised product names, blended 70/30 with a Jaccard
        similarity over product attributes (subcategory, diet tags). An explicit synonym table
        makes “whole milk” meet “full-cream” and “oat drink” meet “Haferdrink” — the realistic
        naming drift in German grocery assortments. Embeddings would add a model download, GPU
        latency and a black box to a ranking that must be explainable per chip; TF-IDF is
        deterministic, inspectable and runs in-browser.
      </>
    ),
  },
  {
    q: "What exactly is the 0–100 score?",
    a: (
      <>
        A weighted composite: semantic 38, price proximity 20, diet fit 14, popularity 12, same
        subcategory 8, rating 8. The weights are chosen so meaning dominates (a cheap but distant
        product never wins) and every component maps to a visible reason chip. Candidates are
        sorted by score, tie-broken by price. Nothing is hidden: the card shows the total, the
        chips show the components.
      </>
    ),
  },
  {
    q: "How does the acceptance model work?",
    a: (
      <>
        A transparent formula, quoted in the README:{" "}
        <code>p = 0.46 + 0.54·(score/100)^1.05 − price-uplift penalty + diet bonus</code>,
        clamped to [0.20, 0.97]. The intercept is calibrated so an anonymous naive swap accepts
        ~50% — matching published online-grocery substitution research — while an explainable
        in-person swap climbs toward 78%. It is a model of human behaviour, so it is a formula
        with stated assumptions, not a neural net pretending to certainty.
      </>
    ),
  },
  {
    q: "Why are the hard rules not AI?",
    a: (
      <>
        Because safety is not probabilistic. “The model usually doesn't suggest nuts to an
        allergic customer” is not an acceptable sentence. Hard rules run before scoring: an
        allergen violation is impossible, not unlikely, and no future AI layer can cross them —
        the AI only ever sees the candidates that already passed. The same discipline as the
        deterministic engines in the rest of this portfolio.
      </>
    ),
  },
  {
    q: "Where is the LLM — and what could it break?",
    a: (
      <>
        Only in word choice. A single serverless function polishes the customer note (EN/DE/ID)
        from the engine's facts — product names, prices and reason are passed through, it may not
        invent anything. Without an API key it answers 501 and the client silently uses the
        deterministic template; the badge in the UI says which source wrote the message. The
        engine, the KPIs and the demo never depend on the model — the LLM can only make the
        sentence nicer, never the numbers different.
      </>
    ),
  },
  {
    q: "How is the simulation kept fair across policies?",
    a: (
      <>
        All three policies replay the identical 1,000 generated baskets against the identical
        shelf state (per-shift drift, popularity-weighted, at least one hero item missing per
        shift). Each policy gets its own independent random stream — the seed is XOR-hashed with
        the policy name — so streams never correlate and comparisons are apples-to-apples. When
        no safe substitute exists, Swap-Smart refunds exactly like the baseline: the engine gets
        no credit for impossible swaps.
      </>
    ),
  },
  {
    q: "How are the business projections computed — and the units kept honest?",
    a: (
      <>
        Raw KPI deltas are projected at a locked assumption set: 350 orders/day per store, 30
        days, €2.50 handling saved per avoided refund. <code>impactSummary()</code> outputs
        per-month figures; the per-1,000-orders deltas are computed separately from the raw KPIs.
        The UI never mixes the two units — “per 1,000 orders” and “per month at 350 orders/day”
        are always labelled. Result at seed 2026: +€5,057 basket per 1,000 orders → €81,843 net
        per month/store, 109 picker-hours saved.
      </>
    ),
  },
  {
    q: "How is the code tested?",
    a: (
      <>
        Vitest (18 tests): byte-level determinism for a fixed seed, every guardrail as a blocker
        test (no out-of-stock, allergen, diet, price-guardrail or cross-category candidate ever
        survives), KPI invariants, the impact projection, dietary profile generation, and the
        multilingual message templates. Playwright (6 e2e): the picker golden path (empty shelf →
        swap → multilingual message → summary), the Ops Deck with the vegan-household explorer
        (dairy must be blocked), the Story proof table, theming, and the Golden Demo. CI runs
        typecheck, unit tests, build and e2e on every push.
      </>
    ),
  },
  {
    q: "What are the honest limitations?",
    a: (
      <>
        The acceptance model is calibrated to published research, not A/B data from a real
        platform. All data is synthetic — the numbers prove the engine's behaviour, not a real
        market. The 20% full-cancellation-after-hero-loss heuristic is an explicit, adjustable
        assumption, not a measured constant. The complaint and picker-time models are
        deliberately simple. And inventory forecasting (predicting <em>what</em> will run out) is
        a non-goal — this tool acts at the moment the shelf is already empty.
      </>
    ),
  },
  {
    q: "Could this run on a real retailer's assortment?",
    a: (
      <>
        The decision core is pure functions over three inputs: a product catalog (price, diet
        tags, allergens, category, popularity), the customer's basket/profile, and the shelf
        state. Point those at a real catalog and inventory feed and the rules, scoring and
        explainability carry over unchanged. That portability is by design — nothing in the
        engine knows anything about any specific platform.
      </>
    ),
  },
]

function QaItem({ qa }: { qa: Qa }) {
  return (
    <details className="group rounded-2xl border border-line bg-surface" data-testid="qa-item">
      <summary className="flex cursor-pointer list-none items-start justify-between gap-3 p-4 font-semibold">
        <span>{qa.q}</span>
        <span
          aria-hidden="true"
          className="mt-0.5 shrink-0 text-muted transition-transform group-open:rotate-45"
        >
          +
        </span>
      </summary>
      <div className="px-4 pb-4 text-sm leading-relaxed text-muted">{qa.a}</div>
    </details>
  )
}

function QaSection({ id, title, blurb, items }: { id: string; title: string; blurb: string; items: Qa[] }) {
  return (
    <section aria-labelledby={id} className="mt-10">
      <h2 id={id} className="text-lg font-bold tracking-tight">
        {title}
      </h2>
      <p className="mt-1 max-w-2xl text-sm text-muted">{blurb}</p>
      <div className="mt-4 space-y-2.5">
        {items.map((qa) => (
          <QaItem key={qa.q} qa={qa} />
        ))}
      </div>
    </section>
  )
}

export function QaPage({ onBack }: { onBack: () => void }) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-xl font-bold tracking-tight">Q&amp;A</h1>
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-muted underline decoration-line underline-offset-4 hover:text-ink"
        >
          back to the app
        </button>
      </div>
      <p className="mt-1 max-w-2xl text-sm text-muted">
        The questions reviewers actually ask about Swap-Smart — answered from two seats: a store
        operations manager's and an engineer's. Every number quoted here is computed by the
        engine (seed 2026, 1,000 orders) and locked by tests.
      </p>

      <QaSection
        id="qa-nontechnical"
        title="For non-technical reviewers"
        blurb="If you run store operations, pick orders yourself, or just want to understand what this tool changes — start here."
        items={NON_TECHNICAL}
      />
      <QaSection
        id="qa-technical"
        title="For technical reviewers"
        blurb="Stack choices, the ranking model, the acceptance formula, LLM guardrails and the testing strategy — with the reasoning behind each decision."
        items={TECHNICAL}
      />

      <p className="mt-10 border-t border-line pt-4 text-xs leading-relaxed text-muted">
        Something still unclear? The repository README documents the full methodology, and the
        honesty section on the Story page lists every assumption with its anchor.
      </p>
    </div>
  )
}
