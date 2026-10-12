/**
 * Deterministic PRNG (mulberry32). Same seed => same sequence, everywhere.
 * Every stochastic step in the app must draw from one of these — never Math.random.
 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export class Rng {
  private next: () => number

  constructor(seed: number) {
    this.next = mulberry32(seed)
  }

  /** float in [0, 1) */
  float(): number {
    return this.next()
  }

  /** float in [min, max) */
  range(min: number, max: number): number {
    return min + this.next() * (max - min)
  }

  /** integer in [min, max] inclusive */
  int(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1))
  }

  /** weighted pick: entries of [value, weight] */
  weighted<T>(entries: ReadonlyArray<readonly [T, number]>): T {
    const total = entries.reduce((s, [, w]) => s + w, 0)
    let roll = this.next() * total
    for (const [value, w] of entries) {
      roll -= w
      if (roll < 0) return value
    }
    const last = entries[entries.length - 1]
    if (!last) throw new Error("Rng.weighted: empty entries")
    return last[0]
  }

  /** Bernoulli trial with probability p */
  chance(p: number): boolean {
    return this.next() < p
  }

  /** sample without replacement: n distinct items */
  sample<T>(arr: readonly T[], n: number): T[] {
    const pool = [...arr]
    const out: T[] = []
    const take = Math.min(n, pool.length)
    for (let i = 0; i < take; i++) {
      const idx = this.int(0, pool.length - 1)
      const picked = pool.splice(idx, 1)[0]
      if (picked !== undefined) out.push(picked)
    }
    return out
  }
}
