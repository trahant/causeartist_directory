#!/usr/bin/env bun
/**
 * Use Claude to infer official websites for published companies missing website.
 * Requires ANTHROPIC_API_KEY.
 * Run: bun scripts/find-missing-websites.ts
 */
import { db } from "~/services/db"

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages"
const MODEL = "claude-sonnet-4-20250514"
const INPUT_TOKEN_PRICE = 0.000003
const OUTPUT_TOKEN_PRICE = 0.000015

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function parseJsonObject(text: string): Record<string, unknown> | null {
  let raw = text.trim()
  if (raw.startsWith("```")) {
    raw = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "")
  }
  try {
    const obj = JSON.parse(raw) as Record<string, unknown>
    return obj && typeof obj === "object" ? obj : null
  } catch {
    return null
  }
}

type Usage = { inputTokens: number; outputTokens: number }

async function anthropicMessages(
  userMessage: string,
  maxTokens: number,
): Promise<{ text: string; usage: Usage }> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error("Missing ANTHROPIC_API_KEY")

  const response = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      messages: [{ role: "user", content: userMessage }],
    }),
  })

  const data: unknown = await response.json().catch(() => null)
  const parsed = data as {
    content?: Array<{ type?: string; text?: string }>
    usage?: { input_tokens?: number; output_tokens?: number }
  } | null

  const usage: Usage = {
    inputTokens: parsed?.usage?.input_tokens ?? 0,
    outputTokens: parsed?.usage?.output_tokens ?? 0,
  }

  if (!response.ok) {
    const errText =
      typeof data === "object" && data !== null && "error" in data
        ? JSON.stringify((data as { error?: unknown }).error)
        : JSON.stringify(data)
    throw new Error(`Anthropic API error ${response.status}: ${errText}`)
  }

  const block = parsed?.content?.[0]
  const jsonText = block?.type === "text" ? block.text : block?.text
  return {
    text: typeof jsonText === "string" ? jsonText : "",
    usage,
  }
}

function hostnameFromWebsite(website: string): string {
  const w = website.trim()
  const withProto = /^https?:\/\//i.test(w) ? w : `https://${w}`
  return new URL(withProto).hostname
}

function normalizeWebsiteUrl(raw: string | null | undefined): string | null {
  if (raw == null || typeof raw !== "string") return null
  const t = raw.trim()
  if (!t || /^null$/i.test(t)) return null
  try {
    const withProto = /^https?:\/\//i.test(t) ? t : `https://${t}`
    const u = new URL(withProto)
    if (!u.hostname) return null
    return withProto
  } catch {
    return null
  }
}

function normalizeConfidence(raw: unknown): "high" | "medium" | "low" | null {
  if (typeof raw !== "string") return null
  const c = raw.trim().toLowerCase()
  if (c === "high" || c === "medium" || c === "low") return c
  return null
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("Missing ANTHROPIC_API_KEY")
    process.exit(1)
  }

  const companies = await db.company.findMany({
    where: {
      status: "published",
      website: null,
    },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  })

  let companiesProcessed = 0
  let websitesFound = 0
  let logosSet = 0
  let notFound = 0
  let totalInputTokens = 0
  let totalOutputTokens = 0

  for (let i = 0; i < companies.length; i++) {
    const company = companies[i]!
    companiesProcessed++

    try {
      const content = `What is the official website URL for this company?

Company name: ${company.name}

Reply with ONLY a JSON object:
{
  "website": "https://www.example.com or null if unknown",
  "confidence": "high, medium, or low"
}

Only return a URL if you are high or medium confidence it is correct.`

      const { text, usage } = await anthropicMessages(content, 100)
      totalInputTokens += usage.inputTokens
      totalOutputTokens += usage.outputTokens

      const obj = parseJsonObject(text)
      if (!obj) {
        notFound++
        continue
      }

      const confidence = normalizeConfidence(obj.confidence)
      const website = normalizeWebsiteUrl(
        typeof obj.website === "string" ? obj.website : null,
      )

      if (
        confidence === null ||
        confidence === "low" ||
        website === null
      ) {
        notFound++
        continue
      }

      let domain: string
      try {
        domain = hostnameFromWebsite(website)
      } catch {
        notFound++
        continue
      }

      const logoUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`

      await db.company.update({
        where: { id: company.id },
        data: { website, logoUrl },
      })
      websitesFound++
      logosSet++
      console.log(`Found: ${company.name} → ${website}`)
    } catch (e) {
      console.error(`Error (${company.name}):`, e)
      notFound++
    }

    await delay(1000)
  }

  const cost =
    totalInputTokens * INPUT_TOKEN_PRICE + totalOutputTokens * OUTPUT_TOKEN_PRICE

  console.log("\n--- Summary ---")
  console.log(`Companies processed: ${companiesProcessed}`)
  console.log(`Websites found: ${websitesFound}`)
  console.log(`Logos set: ${logosSet}`)
  console.log(`Not found: ${notFound}`)
  console.log(`Cost: $${cost.toFixed(4)}`)
  console.log(
    `Tokens: ${totalInputTokens} in / ${totalOutputTokens} out`,
  )
}

main()
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
