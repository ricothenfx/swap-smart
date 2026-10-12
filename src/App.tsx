import { AppProvider, useApp } from "./state/store"
import { Header } from "./components/Header"
import { PickerView } from "./views/PickerView"
import { OpsView } from "./views/OpsView"
import { StoryView } from "./views/StoryView"
import { GoldenDemo } from "./components/GoldenDemo"

function Shell() {
  const { tab } = useApp()
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        {tab === "picker" && <PickerView />}
        {tab === "ops" && <OpsView />}
        {tab === "story" && <StoryView />}
      </main>
      <footer className="border-t border-line py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-1 px-4 text-center text-xs text-muted">
          <p>
            <strong className="text-ink">Swap-Smart</strong> — portfolio engineering for a Delivery
            Hero application. Synthetic Berlin data, fictional brands, deterministic engine.
          </p>
          <p>Every number on this site is reproducible: fixed seed → byte-identical KPIs.</p>
        </div>
      </footer>
      <GoldenDemo />
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  )
}
