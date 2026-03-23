#!/usr/bin/env bun
/**
 * Enrich published companies with description, impactModel, impactMetrics, etc.
 * Run: bun scripts/enrich-company-profiles.ts
 */
import { db } from "~/services/db"

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages"
const MODEL = "claude-sonnet-4-20250514"
const PAGE_TEXT_MAX = 2000
const COMBINED_TEXT_MAX = 6000
const MIN_CONTENT_CHARS = 100
const DELAY_MS = 2000

const INPUT_TOKEN_PRICE = 0.000_003
const OUTPUT_TOKEN_PRICE = 0.000_015

type ExtractedProfile = {
  description: string | null
  impactModel: string | null
  impactMetrics: string | null
  founderName: string | null
  foundedYear: number | null
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function normalizeBaseWebsite(website: string): string {
  const t = website.trim()
  if (!t) return t
  const withProto = /^https?:\/\//i.test(t) ? t : `https://${t}`
  return withProto.replace(/\/+$/, "")
}

function decodeBasicEntities(s: string): string {
  return s
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&nbsp;/gi, " ")
}

function extractMetaContent(html: string, kind: "property" | "name", key: string): string {
  const esc = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const byPropFirst = new RegExp(
    `<meta[^>]+${kind}=["']${esc}["'][^>]+content=["']([^"']*)["']`,
    "i",
  )
  const byContentFirst = new RegExp(
    `<meta[^>]+content=["']([^"']*)["'][^>]+${kind}=["']${esc}["']`,
    "i",
  )
  const m = html.match(byPropFirst) ?? html.match(byContentFirst)
  return m?.[1] ? decodeBasicEntities(m[1].trim()) : ""
}

function stripHtmlToText(html: string): string {
  const noScripts = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
  return noScripts.replace(/<[^>]+>/g, " ")
}

function collapseWhitespace(s: string): string {
  return s.replace(/\s+/g, " ").trim()
}

export async function fetchPageText(url: string): Promise<string> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10_000)

  try {
    const res = await fetch(url, { signal: controller.signal })
    if (!res.ok) return ""
    const html = await res.text()
    if (!html) return ""

    const ogTitle = extractMetaContent(html, "property", "og:title")
    const ogDescription = extractMetaContent(html, "property", "og:description")
    const metaDescription = extractMetaContent(html, "name", "description")

    const metaParts = [ogTitle, ogDescription, metaDescription].filter(Boolean)
    const bodyText = collapseWhitespace(stripHtmlToText(html))
    const combined =
      metaParts.length > 0 ? `${metaParts.join("\n")}\n\n${bodyText}` : bodyText

    const cleaned = collapseWhitespace(combined)
    if (cleaned.length <= PAGE_TEXT_MAX) return cleaned
    return cleaned.slice(0, PAGE_TEXT_MAX)
  } catch {
    return ""
  } finally {
    clearTimeout(timeout)
  }
}

function dedupeChunks(chunks: string[]): string {
  const seen = new Set<string>()
  const out: string[] = []
  for (const c of chunks) {
    const t = c.trim()
    if (!t || seen.has(t)) continue
    seen.add(t)
    out.push(t)
  }
  return out.join("\n\n")
}

export async function fetchCompanyPages(website: string): Promise<string> {
  const base = normalizeBaseWebsite(website)
  if (!base) return ""

  const paths = ["", "/about", "/about-us", "/impact", "/sustainability", "/mission"]
  const urls = paths.map(p => (p === "" ? base : `${base}${p}`))

  const settled = await Promise.allSettled(urls.map(u => fetchPageText(u)))
  const texts: string[] = []
  for (const s of settled) {
    if (s.status === "fulfilled" && s.value) texts.push(s.value)
  }

  const combined = dedupeChunks(texts)
  const collapsed = collapseWhitespace(combined.replace(/\n\n+/g, "\n\n"))
  if (collapsed.length <= COMBINED_TEXT_MAX) return collapsed
  return collapsed.slice(0, COMBINED_TEXT_MAX)
}

type ExtractUsage = { inputTokens: number; outputTokens: number }

function emptyProfile(): ExtractedProfile {
  return {
    description: null,
    impactModel: null,
    impactMetrics: null,
    founderName: null,
    foundedYear: null,
  }
}

function parseAnthropicJson(text: string): ExtractedProfile {
  let raw = text.trim()
  if (raw.startsWith("```")) {
    raw = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "")
  }
  try {
    const obj = JSON.parse(raw) as Record<string, unknown>
    const founded = obj.foundedYear
    let foundedYear: number | null = null
    if (typeof founded === "number" && Number.isFinite(founded)) {
      foundedYear = Math.trunc(founded)
    } else if (typeof founded === "string" && /^\d{4}$/.test(founded)) {
      foundedYear = Number.parseInt(founded, 10)
    }

    return {
      description: typeof obj.description === "string" ? obj.description : null,
      impactModel: typeof obj.impactModel === "string" ? obj.impactModel : null,
      impactMetrics: typeof obj.impactMetrics === "string" ? obj.impactMetrics : null,
      founderName: typeof obj.founderName === "string" ? obj.founderName : null,
      foundedYear,
    }
  } catch {
    return emptyProfile()
  }
}

export async function extractCompanyProfile(
  name: string,
  website: string,
  combinedText: string,
): Promise<{ profile: ExtractedProfile; usage: ExtractUsage }> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error("Missing ANTHROPIC_API_KEY")

  const userMessage = `You are extracting structured profile information about an impact company.

Company name: ${name}
Website: ${website}

Website content:
${combinedText}

Extract the following and return ONLY a JSON object with no markdown, 
no backticks, no explanation:

{
  "description": "Write 3 separate paragraphs about this company. 
    Paragraph 1: What they do and their products/services (2-3 sentences).
    Paragraph 2: Their founding story or mission (2-3 sentences).  
    Paragraph 3: Their impact and why they matter (2-3 sentences).
    Separate each paragraph with a blank line (\\n\\n).
    Minimum 150 words total.",
  "impactModel": "Write 2 separate paragraphs explaining impact.
    Paragraph 1: How their business model creates impact (2-3 sentences).
    Paragraph 2: Specific outcomes or results (2-3 sentences).
    Separate paragraphs with \\n\\n.
    Minimum 75 words total.",
  "impactMetrics": "Specific measurable impact claims the company publishes. 
    Include numbers, statistics, and outcomes if available. 
    Examples: trees planted, people served, CO2 avoided, jobs created.
    If no specific metrics found, return null.",
  "founderName": "Name of founder(s) if mentioned, or null",
  "foundedYear": "Year founded as a number, or null"
}

Rules:
- Base everything only on the provided website content
- Do not invent or hallucinate information
- If you cannot find enough information for a field return null
- description must be substantive — do not return a one-liner
- Return ONLY the JSON object`

  const response = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1500,
      messages: [{ role: "user", content: userMessage }],
    }),
  })

  const data: unknown = await response.json().catch(() => null)

  const parsed = data as {
    content?: Array<{ type?: string; text?: string }>
    usage?: { input_tokens?: number; output_tokens?: number }
  } | null

  const usage: ExtractUsage = {
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
  if (!jsonText || typeof jsonText !== "string") {
    return { profile: emptyProfile(), usage }
  }

  return { profile: parseAnthropicJson(jsonText), usage }
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("Missing ANTHROPIC_API_KEY")
  }

  const companies = await db.company.findMany({
    where: {
      status: "published",
      AND: [{ website: { not: null } }, { website: { not: "" } }],
    },
    orderBy: { name: "asc" },
    select: { id: true, name: true, website: true },
  })

  const total = companies.length
  let updated = 0
  let skipped = 0
  let failed = 0
  let apiCalls = 0
  let totalInputTokens = 0
  let totalOutputTokens = 0

  for (let i = 0; i < companies.length; i++) {
    const company = companies[i]!
    const index = i + 1
    console.log(`Processing: ${company.name} (${index}/${total})`)

    try {
      const website = company.website?.trim() ?? ""
      if (!website) {
        skipped++
        console.log(`Skipping: ${company.name} - insufficient content`)
        await delay(DELAY_MS)
        continue
      }

      const combinedText = await fetchCompanyPages(website)

      if (combinedText.length < MIN_CONTENT_CHARS) {
        skipped++
        console.log(`Skipping: ${company.name} - insufficient content`)
        await delay(DELAY_MS)
        continue
      }

      const { profile, usage } = await extractCompanyProfile(
        company.name,
        website,
        combinedText,
      )
      apiCalls++
      totalInputTokens += usage.inputTokens
      totalOutputTokens += usage.outputTokens

      const data: {
        description: string | null
        impactModel: string | null
        impactMetrics: string | null
        founderName?: string | null
        foundedYear?: number | null
      } = {
        description: profile.description,
        impactModel: profile.impactModel,
        impactMetrics: profile.impactMetrics,
      }

      if (profile.founderName != null) {
        data.founderName = profile.founderName
      }
      if (profile.foundedYear != null) {
        data.foundedYear = profile.foundedYear
      }

      await db.company.update({
        where: { id: company.id },
        data,
      })

      updated++
      console.log(`Updated: ${company.name}`)
    } catch (err) {
      failed++
      console.error(`Error processing ${company.name}:`, err)
    }

    await delay(DELAY_MS)
  }

  const inputCost = totalInputTokens * INPUT_TOKEN_PRICE
  const outputCost = totalOutputTokens * OUTPUT_TOKEN_PRICE
  const estimatedCost = inputCost + outputCost

  console.log("\n--- Summary ---")
  console.log(`Total companies processed: ${total}`)
  console.log(`Successfully updated: ${updated}`)
  console.log(`Skipped (insufficient content): ${skipped}`)
  console.log(`Failed: ${failed}`)
  console.log(`Total API calls: ${apiCalls}`)
  console.log(`Total input tokens: ${totalInputTokens}`)
  console.log(`Total output tokens: ${totalOutputTokens}`)
  console.log(`Estimated cost: $${estimatedCost.toFixed(4)}`)
}

main()
  .then(() => {
    process.exit(0)
  })
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
