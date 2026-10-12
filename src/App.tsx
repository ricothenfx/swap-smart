import { AppProvider, useApp } from "./state/store"
import { Header } from "./components/Header"
import { PickerView } from "./views/PickerView"
import { OpsView } from "./views/OpsView"
import { StoryView } from "./views/StoryView"
import { QaPage } from "./components/QaPage"
import { GoldenDemo } from "./components/GoldenDemo"

function Shell() {
  const { tab, setTab } = useApp()
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        {tab === "picker" && <PickerView />}
        {tab === "ops" && <OpsView />}
        {tab === "story" && <StoryView />}
        {tab === "qa" && <QaPage onBack={() => setTab("picker")} />}
      </main>
      <footer className="border-t border-line py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-1 px-4 text-center text-xs text-muted">
          <p>
            <strong className="text-ink">Swap-Smart</strong> — substitution decision support for
            dark-store &amp; q-commerce operations. Synthetic Berlin data, fictional brands,
            deterministic engine.
          </p>
          <p>
            Every number on this site is reproducible: fixed seed → byte-identical KPIs.{" "}
            <button
              type="button"
              onClick={() => setTab("qa")}
              className="underline decoration-line underline-offset-4 hover:text-ink"
            >
              Q&amp;A
            </button>{" "}
            answers the questions reviewers ask.
          </p>
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
