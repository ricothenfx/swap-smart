import type { Product } from "./types"

/**
 * Customer-facing substitution messages — deterministic templates (replay mode).
 * The optional AI writer (api/message.ts) only ever polishes these; it never
 * invents facts: product names, prices and the reason are passed through.
 */

export type Locale = "en" | "de" | "id"

export const LOCALES: { code: Locale; label: string }[] = [
  { code: "en", label: "English" },
  { code: "de", label: "Deutsch" },
  { code: "id", label: "Bahasa Indonesia" },
]

const T = {
  en: {
    swapped: (p: { target: string; sub: string; reason: string }) =>
      `We swapped your ${p.target} for ${p.sub} — ${p.reason}.`,
    price: (d: string) => `Price difference: ${d}.`,
    door: "Changed your mind? Just hand it back at the door for an instant refund.",
    cheaper: (d: string) => `${d} cheaper`,
    more: (d: string) => `${d} more`,
    same: "same price",
    best: "best match in stock",
  },
  de: {
    swapped: (p: { target: string; sub: string; reason: string }) =>
      `Wir haben ${p.target} durch ${p.sub} ersetzt — ${p.reason}.`,
    price: (d: string) => `Preisdifferenz: ${d}.`,
    door: "Andere Meinung? Einfach an der Tür zurückgeben — sofortige Erstattung.",
    cheaper: (d: string) => `${d} günstiger`,
    more: (d: string) => `${d} teurer`,
    same: "gleicher Preis",
    best: "beste verfügbare Alternative",
  },
  id: {
    swapped: (p: { target: string; sub: string; reason: string }) =>
      `Kami mengganti ${p.target} dengan ${p.sub} — ${p.reason}.`,
    price: (d: string) => `Selisih harga: ${d}.`,
    door: "Berubah pikiran? Kembalikan di pintu — refund langsung.",
    cheaper: (d: string) => `lebih murah ${d}`,
    more: (d: string) => `lebih mahal ${d}`,
    same: "harga sama",
    best: "alternatif terbaik yang tersedia",
  },
} as const

export function swapMessage(input: {
  target: Product
  sub: Product
  priceDelta: number
  locale: Locale
}): string {
  const t = T[input.locale]
  const targetName = `${input.target.brand} ${input.target.name}`
  const subName = `${input.sub.brand} ${input.sub.name}`
  const delta =
    input.priceDelta < -0.005
      ? t.cheaper(eur(Math.abs(input.priceDelta)))
      : input.priceDelta > 0.005
        ? t.more(eur(input.priceDelta))
        : t.same
  return `${t.swapped({ target: targetName, sub: subName, reason: t.best })} ${t.price(delta)} ${t.door}`
}

export function eur(v: number): string {
  return `€${v.toFixed(2)}`
}

/** Same engine in the optional serverless AI writer contract. */
export interface WriterRequest {
  target: { name: string; price: number }
  sub: { name: string; price: number }
  priceDelta: number
  reason: string
  locale: Locale
}
