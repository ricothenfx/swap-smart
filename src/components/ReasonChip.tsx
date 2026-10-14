import { motion } from "framer-motion"
import type { Reason } from "../engine"
import { Hint } from "./Hint"

const STYLE: Record<Reason["kind"], string> = {
  semantic: "border-accent/40 bg-accent-soft text-accent",
  price: "border-line bg-surface-2 text-ink",
  diet: "border-accent/40 bg-accent-soft text-accent",
  popularity: "border-line bg-surface-2 text-muted",
  rating: "border-warn/40 bg-warn-soft text-warn",
  category: "border-line bg-surface-2 text-muted",
}

const TIP: Record<Reason["kind"], string> = {
  semantic:
    "Name similarity vs the missing item (0–100%). A low number is honest — the card can still win on price, diet fit and popularity.",
  price:
    "Price difference vs the missing item. The score prefers the closest price — cheaper is not automatically better — and the guardrail blocks anything more than +25%.",
  diet:
    "Matches this customer's dietary profile. Diet fit is a hard rule: nothing outside the profile is ever suggested.",
  popularity:
    "Popularity 60+/100 in this store's sales data — popular substitutes get accepted by customers more often.",
  rating:
    "Average customer rating. The chip appears from 4.5 up; lower ratings still count toward the score.",
  category:
    "Same subcategory (shelf row) as the missing item — the closest like-for-like swap in the store.",
}

export function ReasonChip({ reason, index = 0 }: { reason: Reason; index?: number }) {
  return (
    <motion.span
      initial={{ opacity: 0, y: 6, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.12 + index * 0.07, type: "spring", stiffness: 400, damping: 26 }}
    >
      <Hint tip={TIP[reason.kind]} className={"chip " + (STYLE[reason.kind] ?? "")}>
        {reason.label}
      </Hint>
    </motion.span>
  )
}
