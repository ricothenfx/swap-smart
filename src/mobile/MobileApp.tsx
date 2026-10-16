import { useEffect, useState } from "react"
import { Capacitor } from "@capacitor/core"
import { Style, StatusBar } from "@capacitor/status-bar"
import { useApp } from "../state/store"
import { PickerSessionProvider } from "../views/PickerSession"
import { PickerHandheld } from "../views/PickerHandheld"
import { AboutView } from "./AboutView"
import { pickerHaptic } from "./haptics"

type MobileTab = "picker" | "about"

export function MobileApp() {
  const { theme } = useApp()
  const [tab, setTab] = useState<MobileTab>("picker")

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return
    void (async () => {
      try {
        await StatusBar.setStyle({ style: theme === "dark" ? Style.Dark : Style.Light })
        const surface = getComputedStyle(document.documentElement).getPropertyValue("--surface").trim()
        if (surface) await StatusBar.setBackgroundColor({ color: surface })
      } catch {
        // status bar styling is cosmetic
      }
    })()
  }, [theme])

  return (
    <div
      className="flex h-[100dvh] flex-col bg-background text-ink"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <main className="min-h-0 flex-1">
        {tab === "picker" ? (
          <PickerSessionProvider onEvent={pickerHaptic}>
            <div className="h-full overflow-y-auto scroll-thin">
              <PickerHandheld />
            </div>
          </PickerSessionProvider>
        ) : (
          <AboutView />
        )}
      </main>
      <nav
        className="flex border-t border-line bg-surface"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <TabButton active={tab === "picker"} onClick={() => setTab("picker")} label="Picker">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M4 8h13l-3.2-3.2M20 16H7l3.2 3.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </TabButton>
        <TabButton active={tab === "about"} onClick={() => setTab("about")} label="About">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
            <path d="M12 11v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <circle cx="12" cy="7.6" r="1.3" fill="currentColor" />
          </svg>
        </TabButton>
      </nav>
    </div>
  )
}

function TabButton({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean
  onClick: () => void
  label: string
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={
        "flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-semibold uppercase tracking-wider transition-colors " +
        (active ? "text-accent" : "text-muted")
      }
    >
      {children}
      {label}
    </button>
  )
}
