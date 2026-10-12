import { motion } from "framer-motion"
import type { Reason } from "../engine"

const STYLE: Record<Reason["kind"], string> = {
  semantic: "border-accent/40 bg-accent-soft text-accent",
  price: "border-line bg-surface-2 text-ink",
  diet: "border-accent/40 bg-accent-soft text-accent",
  popularity: "border-line bg-surface-2 text-muted",
  rating: "border-warn/40 bg-warn-soft text-warn",
  category: "border-line bg-surface-2 text-muted",
}

export function ReasonChip({ reason, index = 0 }: { reason: Reason; index?: number }) {
  return (
    <motion.span
      initial={{ opacity: 0, y: 6, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.12 + index * 0.07, type: "spring", stiffness: 400, damping: 26 }}
      className={"chip " + (STYLE[reason.kind] ?? "")}
    >
      {reason.label}
    </motion.span>
  )
}
