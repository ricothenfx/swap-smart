import { useEffect, useState } from "react"

const APK_URL = "/swap-smart.apk"

export function ApkPage() {
  const [sizeMb, setSizeMb] = useState<string | null>(null)
  const [onAndroid, setOnAndroid] = useState(false)

  useEffect(() => {
    setOnAndroid(/android/i.test(navigator.userAgent))
    void (async () => {
      try {
        const res = await fetch(APK_URL, { method: "HEAD" })
        const bytes = Number(res.headers.get("content-length"))
        if (bytes > 0) setSizeMb((bytes / 1024 / 1024).toFixed(1))
      } catch {
        // size label is cosmetic
      }
    })()
  }, [])

  return (
    <div className="min-h-screen bg-background text-ink">
      {/* top bar */}
      <header className="border-b border-line bg-[var(--header-bg)] backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-2.5 px-4 py-3 sm:px-6">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-accent text-accent-ink shadow-card">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M4 8h13l-3.2-3.2M20 16H7l3.2 3.2" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="text-[15px] font-extrabold tracking-tight">
            SWAP<span className="text-accent">-</span>SMART
          </span>
          <a href="/" className="btn-ghost ml-auto !px-3 !py-1.5 text-[13px]">
            Open the web demo ↗
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        {/* hero */}
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent">Android app</p>
        <h1 className="mt-2 text-4xl font-extrabold tracking-tight">
          The picker handheld,
          <br />
          <span className="text-accent">as a real app.</span>
        </h1>
        <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-muted">
          The same substitution engine you see in the web demo — packaged as an installable Android
          app. Report the shelf, get explainable swap suggestions, confirm in one tap. Works fully
          offline: the engine runs on the device, no account, no tracking.
        </p>

        <div className="mt-7 flex flex-wrap items-center gap-4">
          <a href={APK_URL} download className="btn-primary !px-6 !py-3.5 text-base" rel="noopener">
            ⤓ Download APK{sizeMb ? ` (${sizeMb} MB)` : ""}
          </a>
          <div className="text-[12px] leading-snug text-muted">
            <p>
              debug-signed demo build · Android 7.0+
              {sizeMb ? "" : " · ~5 MB"}
            </p>
            <p>Not on the Play Store — installed by sideload.</p>
          </div>
        </div>
        {onAndroid && (
          <p className="mt-3 rounded-xl border border-accent/40 bg-accent-soft px-3.5 py-2.5 text-[13px] font-medium text-accent">
            You're on Android — tap Download, then open the file from your notifications to install.
          </p>
        )}

        {/* qr + install */}
        <div className="mt-9 grid gap-4 sm:grid-cols-[auto_1fr]">
          <div className="card grid place-items-center px-6 py-5">
            <img src="/apk-qr.svg" alt="QR code to this page" width={168} height={168} className="rounded-lg" />
            <p className="mt-2 text-center text-[11px] text-muted">
              scan to open
              <br />
              <span className="font-mono">swap-smart.ricothen.com/apk</span>
            </p>
          </div>
          <div className="card px-5 py-5">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent">Install in 3 steps</h2>
            <ol className="mt-3 space-y-3 text-[13px] leading-relaxed">
              {[
                ["Download", "Tap the button (or scan the QR code on your phone). You get swap-smart.apk."],
                ["Allow the install", "Android asks once: “install unknown apps”. Allow it for your browser or file manager — the app is debug-signed, normal for demos."],
                ["Open & pick", "Launch Swap-Smart from your app drawer. Dark theme is default-friendly for warehouse lighting; toggle it in About."],
              ].map(([t, d], i) => (
                <li key={t} className="flex gap-3">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-accent-soft font-mono text-[11px] font-bold text-accent">
                    {i + 1}
                  </span>
                  <span>
                    <strong className="font-semibold">{t}.</strong> <span className="text-muted">{d}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* what's inside */}
        <h2 className="mt-9 text-[11px] font-bold uppercase tracking-[0.18em] text-accent">What's inside</h2>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {[
            "Picker flow — the one-tap swap",
            "About screen — the proof KPIs",
            "Haptic feedback on finds & swaps",
            "Deterministic engine, offline",
            "Light & dark theme",
            "Same seed-2026 numbers as this site",
          ].map((f) => (
            <span key={f} className="chip">
              {f}
            </span>
          ))}
        </div>

        {/* honesty */}
        <div className="card mt-9 px-5 py-4 text-[12px] leading-relaxed text-muted">
          <strong className="text-ink">Honesty.</strong> This APK is a demo build, signed with a
          debug key — Play Store distribution would need a release key. It requests{" "}
          <strong className="text-ink">no sensitive permissions</strong> (internet only, for the
          optional message-polish AI; without a key everything runs on templates). All data is
          synthetic — fictional Berlin brands, no real products, no accounts, no tracking.
        </div>

        <p className="mt-8 text-center text-[11px] text-muted">
          Prefer no install? The <a href="/" className="underline decoration-line underline-offset-4 hover:text-ink">full web demo</a>{" "}
          runs in any browser — same engine, same numbers.
        </p>
      </main>
    </div>
  )
}
