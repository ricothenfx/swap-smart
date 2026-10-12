import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { runSimulation, type Simulation } from "../engine"

export type Tab = "picker" | "ops" | "story" | "qa"

interface AppState {
  theme: "light" | "dark"
  toggleTheme: () => void
  tab: Tab
  setTab: (t: Tab) => void
  seed: number
  setSeed: (n: number) => void
  orderCount: number
  setOrderCount: (n: number) => void
  sim: Simulation
  /** golden demo overlay */
  demoOpen: boolean
  setDemoOpen: (b: boolean) => void
}

const Ctx = createContext<AppState | null>(null)

function initialTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light"
  const stored = localStorage.getItem("swap-smart-theme")
  if (stored === "dark" || stored === "light") return stored
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

export const DEFAULT_SEED = 2026
export const DEFAULT_ORDER_COUNT = 1000

export function AppProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<"light" | "dark">(initialTheme)
  const [tab, setTab] = useState<Tab>("picker")
  const [seed, setSeed] = useState(DEFAULT_SEED)
  const [orderCount, setOrderCount] = useState(DEFAULT_ORDER_COUNT)
  const [demoOpen, setDemoOpen] = useState(false)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem("swap-smart-theme", theme)
  }, [theme])

  const sim = useMemo(() => runSimulation({ orders: orderCount, seed }), [orderCount, seed])

  const value: AppState = {
    theme,
    toggleTheme: () => setTheme((t) => (t === "light" ? "dark" : "light")),
    tab,
    setTab,
    seed,
    setSeed,
    orderCount,
    setOrderCount,
    sim,
    demoOpen,
    setDemoOpen,
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useApp(): AppState {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error("useApp outside AppProvider")
  return ctx
}
