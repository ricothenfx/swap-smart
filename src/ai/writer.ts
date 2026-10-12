import { swapMessage, type Locale, type Product } from "../engine"

/**
 * Client wrapper for the optional AI message writer.
 * Contract: POST /api/message → { ok: true, text } | { ok: false, mode: "template" }.
 * No API key configured (default) → server answers 501 → we fall back to the
 * deterministic template. The demo NEVER breaks because AI is missing.
 */

export interface WrittenMessage {
  text: string
  source: "ai" | "template"
}

export async function writeMessage(input: {
  target: Product
  sub: Product
  priceDelta: number
  reason: string
  locale: Locale
  signal?: AbortSignal
}): Promise<WrittenMessage> {
  try {
    const res = await fetch("/api/message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        target: { name: `${input.target.brand} ${input.target.name}`, price: input.target.price },
        sub: { name: `${input.sub.brand} ${input.sub.name}`, price: input.sub.price },
        priceDelta: input.priceDelta,
        reason: input.reason,
        locale: input.locale,
      }),
      signal: input.signal,
    })
    if (!res.ok) throw new Error(String(res.status))
    const data: unknown = await res.json()
    if (
      data &&
      typeof data === "object" &&
      "ok" in data &&
      (data as { ok: unknown }).ok === true &&
      typeof (data as { text?: unknown }).text === "string"
    ) {
      return { text: (data as { text?: unknown }).text as string, source: "ai" }
    }
    throw new Error("bad payload")
  } catch {
    return {
      text: swapMessage({
        target: input.target,
        sub: input.sub,
        priceDelta: input.priceDelta,
        locale: input.locale,
      }),
      source: "template",
    }
  }
}
