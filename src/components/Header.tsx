import { useApp, type Tab } from "../state/store"

const TABS: { id: Tab; label: string; hint: string }[] = [
  { id: "picker", label: "Picker", hint: "the one-tap flow" },
  { id: "ops", label: "Ops Deck", hint: "the numbers" },
  { id: "story", label: "Story", hint: "problem → proof" },
]

export function Header() {
  const { tab, setTab, theme, toggleTheme, setDemoOpen } = useApp()
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-[var(--header-bg)] backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
        <button
          onClick={() => setTab("picker")}
          className="flex items-center gap-2.5"
          aria-label="Swap-Smart home"
        >
          <Logo />
          <span className="hidden flex-col leading-tight sm:flex">
            <span className="text-[15px] font-extrabold tracking-tight">
              SWAP<span className="text-accent">-</span>SMART
            </span>
            <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted">
              substitution engine · dark stores
            </span>
          </span>
        </button>

        <nav className="ml-auto flex items-center gap-1 rounded-xl border border-line bg-background p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={
                "rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors " +
                (tab === t.id
                  ? "bg-accent text-accent-ink"
                  : "text-muted hover:text-ink")
              }
              aria-current={tab === t.id ? "page" : undefined}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <button
          onClick={() => setDemoOpen(true)}
          className="btn-primary hidden !py-2 md:inline-flex"
        >
          ▶ Golden Demo
        </button>

        <ThemeButton theme={theme} onClick={toggleTheme} />
      </div>
    </header>
  )
}

function Logo() {
  return (
    <span className="relative grid h-9 w-9 place-items-center rounded-xl bg-accent text-accent-ink shadow-card">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M4 8h13l-3.2-3.2M20 16H7l3.2 3.2"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  )
}

function ThemeButton({ theme, onClick }: { theme: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="btn-ghost !px-2.5 !py-2"
      aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
      title={theme === "light" ? "Dark mode" : "Light mode"}
    >
      {theme === "light" ? (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.8 6.8 0 0 0 9.8 9.8Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="2" />
          <path
            d="M12 2.5v2.4M12 19.1v2.4M2.5 12h2.4M19.1 12h2.4M5 5l1.7 1.7M17.3 17.3 19 19M19 5l-1.7 1.7M6.7 17.3 5 19"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      )}
    </button>
  )
}
