import type { ReactNode } from "react"

/** Device chrome so the mobile picker reads as a real handheld on desktop. */
export function PhoneFrame({ children, label }: { children: ReactNode; label?: string }) {
  return (
    <div className="relative mx-auto w-full max-w-[390px]">
      <div className="rounded-[2.6rem] border border-line bg-surface-2 p-2.5 shadow-pop">
        <div className="relative overflow-hidden rounded-[2.1rem] border border-line bg-background">
          {/* status bar */}
          <div className="flex items-center justify-between bg-surface px-6 pb-1 pt-3 text-[11px] font-semibold text-muted">
            <span className="tnum">9:41</span>
            <span className="absolute left-1/2 top-2 h-5 w-24 -translate-x-1/2 rounded-full bg-surface-2" />
            <span className="flex items-center gap-1" aria-hidden>
              <svg width="15" height="11" viewBox="0 0 16 12" fill="currentColor">
                <rect x="0" y="7" width="3" height="5" rx="0.8" />
                <rect x="4.3" y="4.5" width="3" height="7.5" rx="0.8" />
                <rect x="8.6" y="2" width="3" height="10" rx="0.8" />
                <rect x="12.9" y="0" width="3" height="12" rx="0.8" opacity="0.35" />
              </svg>
              <span className="tnum">87%</span>
            </span>
          </div>
          <div className="h-[720px] overflow-y-auto scroll-thin">{children}</div>
        </div>
      </div>
      {label && (
        <div className="mt-3 text-center text-xs font-medium uppercase tracking-[0.16em] text-muted">
          {label}
        </div>
      )}
    </div>
  )
}
