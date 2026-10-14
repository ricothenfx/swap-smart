import { useRef, useState, type ReactNode } from "react"

/**
 * Hover/focus tooltip that explains what a number or chip means.
 * CSS reveal (works with reduced-motion), keyboard & tap accessible.
 * align="start" anchors the tooltip's left edge (default, good for left-side
 * content); align="end" anchors its right edge (right-side content).
 * Flips below the trigger when there is no room above (phone edges).
 */
export function Hint({
  tip,
  children,
  className,
  align = "start",
}: {
  tip: string
  children: ReactNode
  className?: string
  align?: "start" | "end"
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const [below, setBelow] = useState(false)

  function syncSide() {
    const r = ref.current?.getBoundingClientRect()
    if (r) setBelow(r.top < 116)
  }

  const anchor = align === "end" ? "right-0" : "left-0"
  const side = below ? "top-full mt-1.5" : "bottom-full mb-1.5"
  return (
    <span
      ref={ref}
      tabIndex={0}
      onMouseEnter={syncSide}
      onFocus={syncSide}
      className={"group/hint relative inline-flex cursor-help outline-offset-2 " + (className ?? "")}
    >
      {children}
      <span
        aria-hidden
        className={
          "pointer-events-none absolute z-30 w-max max-w-[min(240px,70vw)] rounded-lg bg-ink px-2.5 py-1.5 text-[11px] font-medium normal-case leading-snug tracking-normal text-background opacity-0 shadow-pop transition-opacity duration-150 invisible group-focus-within/hint:visible group-focus-within/hint:opacity-100 group-hover/hint:visible group-hover/hint:opacity-100 " +
          side +
          " " +
          anchor
        }
      >
        {tip}
      </span>
      <span className="sr-only">{tip}</span>
    </span>
  )
}

/** Small ⓘ affordance that marks a hintable number. */
export function HintIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 16 16"
      fill="none"
      className="shrink-0 text-muted transition-colors group-hover/hint:text-accent group-focus-within/hint:text-accent"
      aria-hidden
    >
      <circle cx="8" cy="8" r="6.4" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="8" cy="5.2" r="0.9" fill="currentColor" />
      <path d="M8 7.4v3.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}
