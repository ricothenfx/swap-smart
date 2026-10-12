import { CATALOG } from "./catalog"
import type { Product } from "./types"

/**
 * Semantic-ish product similarity — deterministic, explainable, in-browser.
 *
 * Two signals, blended:
 *  1. text similarity: TF-IDF cosine over tokenised names (+ synonym expansion),
 *  2. attribute similarity: Jaccard over {subcategory, dietTags}.
 *
 * No black box: every suggestion can show "94% match" and mean something.
 */

/** Synonym expansion keeps this honest for real-world naming drift. */
const SYNONYMS: Record<string, string> = {
  whole: "full-cream vollmilch whole",
  "full-cream": "whole vollmilch",
  vollmilch: "whole full-cream",
  oat: "oat hafer haferdrink",
  haferdrink: "oat hafer",
  hafer: "oat haferdrink",
  almond: "almond mandel",
  mandel: "almond",
  soy: "soy soya soja",
  soja: "soy soya",
  soya: "soy soja",
  "plant-based": "vegan",
  vegan: "plant-based",
  lactose: "lactose-free lactose",
  "lactose-free": "lactose",
  "gluten-free": "gluten",
  mince: "mince ground",
  ground: "mince ground",
  capsicum: "pepper",
  fizzy: "sparkling",
  sparkling: "fizzy",
  semi: "semi-skimmed half-fat",
  "semi-skimmed": "semi half-fat",
  "half-fat": "semi semi-skimmed",
}

const STOP = new Set([
  "pc",
  "g",
  "kg",
  "ml",
  "l",
  "x",
  "und",
  "organic", // weak signal, carried by tags instead
])

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[%.]/g, " ")
    .split(/[^a-z]+/)
    .filter((t) => t.length > 1 && !STOP.has(t))
    .flatMap((t) => (SYNONYMS[t] ? `${t} ${SYNONYMS[t]}`.split(" ") : [t]))
}

function attrSet(p: Product): Set<string> {
  const s = new Set<string>([`sub:${p.subcategory}`, ...p.dietTags.map((t) => `tag:${t}`)])
  if (p.hero) s.add("hero")
  return s
}

// ---- TF-IDF over the catalog, computed once at module load ----

const DOC_TOKENS: string[][] = CATALOG.map((p) => tokenize(`${p.name} ${p.subcategory}`))
const DF = new Map<string, number>()
for (const tokens of DOC_TOKENS) {
  for (const t of new Set(tokens)) DF.set(t, (DF.get(t) ?? 0) + 1)
}
const N = CATALOG.length
function idf(term: string): number {
  return Math.log(1 + N / (1 + (DF.get(term) ?? 0)))
}

function tfidfVector(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>()
  for (const t of tokens) tf.set(t, (tf.get(t) ?? 0) + 1)
  const vec = new Map<string, number>()
  for (const [t, count] of tf) vec.set(t, (1 + Math.log(count)) * idf(t))
  return vec
}

function cosine(a: Map<string, number>, b: Map<string, number>): number {
  let dot = 0
  let na = 0
  let nb = 0
  for (const [, v] of a) na += v * v
  for (const [t, v] of b) {
    nb += v * v
    const av = a.get(t)
    if (av) dot += av * v
  }
  if (na === 0 || nb === 0) return 0
  return dot / Math.sqrt(na * nb)
}

function jaccard(a: Set<string>, b: Set<string>): number {
  let inter = 0
  for (const t of a) if (b.has(t)) inter++
  const union = a.size + b.size - inter
  return union === 0 ? 0 : inter / union
}

const DOC_VECTORS = DOC_TOKENS.map((tokens) => tfidfVector(tokens))
const DOC_ATTRS = CATALOG.map((p) => attrSet(p))

const VEC_BY_ID = new Map<string, { vec: Map<string, number>; attrs: Set<string> }>(
  CATALOG.map((p, i) => [p.id, { vec: DOC_VECTORS[i]!, attrs: DOC_ATTRS[i]! }]),
)

export interface Similarity {
  /** 0–1 blended score */
  score: number
  /** text-only cosine, 0–1 (the "94% match" chip) */
  textMatch: number
}

export function similarity(a: Product, b: Product): Similarity {
  const va = VEC_BY_ID.get(a.id)!
  const vb = VEC_BY_ID.get(b.id)!
  const text = cosine(va.vec, vb.vec)
  const attr = jaccard(va.attrs, vb.attrs)
  return { score: 0.7 * text + 0.3 * attr, textMatch: text }
}
