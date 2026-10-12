/**
 * Optional AI writer (Vercel serverless). Runs only when OPENAI_API_KEY is set.
 * Without a key it answers 501 and the client silently uses the deterministic
 * template — the product rule: engine computes, LLM only chooses words.
 */

interface Req {
  method?: string
  body?: unknown
}

interface Res {
  status: (code: number) => Res
  json: (payload: unknown) => void
}

interface Body {
  target?: { name?: string; price?: number }
  sub?: { name?: string; price?: number }
  priceDelta?: number
  reason?: string
  locale?: string
}

const LOCALE_NAME: Record<string, string> = {
  en: "English",
  de: "German",
  id: "Indonesian",
}

export default async function handler(req: Req, res: Res) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "POST only" })
    return
  }
  const key = process.env.OPENAI_API_KEY
  if (!key) {
    res.status(501).json({ ok: false, mode: "template" })
    return
  }
  const body = (req.body ?? {}) as Body
  const target = body.target?.name
  const sub = body.sub?.name
  if (!target || !sub) {
    res.status(400).json({ ok: false, error: "target and sub are required" })
    return
  }
  const locale = LOCALE_NAME[body.locale ?? "en"] ?? "English"
  const delta =
    typeof body.priceDelta === "number" && Math.abs(body.priceDelta) > 0.005
      ? ` Price difference: €${Math.abs(body.priceDelta).toFixed(2)} ${body.priceDelta < 0 ? "cheaper" : "more"}.`
      : " Same price."

  try {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.4,
        max_tokens: 90,
        messages: [
          {
            role: "system",
            content:
              "You write short, warm customer notifications for a grocery delivery app. One substitution happened. Never invent facts, never promise discounts. Max 2 sentences. Reply in the requested language only.",
          },
          {
            role: "user",
            content: `Product ordered: ${target} (€${(body.target?.price ?? 0).toFixed(2)}). We shipped instead: ${sub} (€${(body.sub?.price ?? 0).toFixed(2)}).${delta} Reason: ${body.reason ?? "best match in stock"}. Language: ${locale}.`,
          },
        ],
      }),
    })
    if (!r.ok) throw new Error(String(r.status))
    const data: unknown = await r.json()
    const text = (data as { choices?: { message?: { content?: string } }[] })?.choices?.[0]?.message?.content
    if (typeof text !== "string" || text.length < 5) throw new Error("empty completion")
    res.status(200).json({ ok: true, text: text.trim(), source: "ai" })
  } catch {
    res.status(502).json({ ok: false, mode: "template" })
  }
}
