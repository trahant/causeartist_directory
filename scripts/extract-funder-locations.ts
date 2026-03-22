#!/usr/bin/env bun
/**
 * Infer funder HQ: pass 1 = scraped pages + Claude; pass 2 = Claude knowledge only.
 * Upsert Location, link FunderLocation. Only funders with no locations yet.
 * Run: bun scripts/extract-funder-locations.ts
 */
import { db } from "~/services/db"

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages"
const MODEL = "claude-sonnet-4-20250514"
const PAGE_TEXT_MAX = 2000
const COMBINED_PAGE_TEXT_MAX = 4000
const FETCH_TIMEOUT_MS = 8000
const DELAY_MS = 1000
const DELAY_MS_KNOWLEDGE_PASS = 500

const INPUT_TOKEN_PRICE = 0.000_003
const OUTPUT_TOKEN_PRICE = 0.000_015

const VALID_REGIONS = [
  "north-america",
  "europe",
  "asia-pacific",
  "latin-america",
  "africa",
  "middle-east",
] as const

const COUNTRY_TO_REGION: Record<string, string> = {
  US: "north-america",
  CA: "north-america",
  MX: "north-america",
  GB: "europe",
  DE: "europe",
  FR: "europe",
  NL: "europe",
  SE: "europe",
  NO: "europe",
  DK: "europe",
  FI: "europe",
  CH: "europe",
  AT: "europe",
  BE: "europe",
  ES: "europe",
  IT: "europe",
  PT: "europe",
  IE: "europe",
  AU: "asia-pacific",
  NZ: "asia-pacific",
  JP: "asia-pacific",
  KR: "asia-pacific",
  SG: "asia-pacific",
  IN: "asia-pacific",
  CN: "asia-pacific",
  ID: "asia-pacific",
  PH: "asia-pacific",
  BR: "latin-america",
  AR: "latin-america",
  CO: "latin-america",
  CL: "latin-america",
  PE: "latin-america",
  KE: "africa",
  NG: "africa",
  GH: "africa",
  ZA: "africa",
  ET: "africa",
  RW: "africa",
  UG: "africa",
  TZ: "africa",
  IL: "middle-east",
  AE: "middle-east",
  SA: "middle-east",
  JO: "middle-east",
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
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

async function fetchPageText(url: string): Promise<string> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const res = await fetch(url, { signal: controller.signal })
    if (!res.ok) return ""
    const html = await res.text()
    if (!html) return ""

    const ogDescription = extractMetaContent(html, "property", "og:description")
    const metaDescription = extractMetaContent(html, "name", "description")

    const metaParts = [ogDescription, metaDescription].filter(Boolean)
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

/** Homepage + about/contact paths (same approach as company script; no /company). */
async function fetchCompanyPageText(website: string): Promise<string> {
  const w = website.trim()
  const base = w.replace(/\/+$/, "")
  const pagesToTry = [
    w,
    `${base}/about`,
    `${base}/about-us`,
    `${base}/contact`,
    `${base}/contact-us`,
  ]

  const results = await Promise.allSettled(pagesToTry.map(url => fetchPageText(url)))

  const combined = results
    .filter((r): r is PromiseFulfilledResult<string> => r.status === "fulfilled")
    .map(r => r.value)
    .filter(text => text.length > 50)
    .join("\n\n")

  return combined.slice(0, COMBINED_PAGE_TEXT_MAX)
}

type ExtractedHq = { country: string; countryCode: string; city?: string }

type ClaudeUsage = { inputTokens: number; outputTokens: number }

async function extractLocationWithUsage(
  name: string,
  website: string,
  pageText: string,
): Promise<{ result: ExtractedHq | null; usage: ClaudeUsage }> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error("Missing ANTHROPIC_API_KEY")

  const content = `Where is this company headquartered?

Company: ${name}
Website: ${website}
Page content: ${pageText}

Reply with ONLY a JSON object, no markdown, no explanation:
{
  "country": "Full country name e.g. United States",
  "countryCode": "ISO 2-letter code e.g. US",
  "city": "City name or null"
}

If you cannot determine the location with confidence return:
{"country": null, "countryCode": null, "city": null}`

  const response = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 100,
      messages: [{ role: "user", content }],
    }),
  })

  const data: unknown = await response.json().catch(() => null)
  const parsed = data as {
    content?: Array<{ type?: string; text?: string }>
    usage?: { input_tokens?: number; output_tokens?: number }
  } | null

  const usage = {
    inputTokens: parsed?.usage?.input_tokens ?? 0,
    outputTokens: parsed?.usage?.output_tokens ?? 0,
  }

  if (!response.ok) {
    throw new Error(
      `Anthropic API error ${response.status}: ${JSON.stringify(
        typeof data === "object" && data && "error" in data
          ? (data as { error?: unknown }).error
          : data,
      )}`,
    )
  }

  const block = parsed?.content?.[0]
  const jsonText = block?.type === "text" ? block.text : block?.text
  if (!jsonText || typeof jsonText !== "string") {
    return { result: null, usage }
  }

  let raw = jsonText.trim()
  if (raw.startsWith("```")) {
    raw = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "")
  }

  try {
    const obj = JSON.parse(raw) as Record<string, unknown>
    const country = obj.country
    const countryCode = obj.countryCode
    if (
      country == null ||
      countryCode == null ||
      typeof country !== "string" ||
      typeof countryCode !== "string"
    ) {
      return { result: null, usage }
    }
    const c = country.trim()
    const cc = countryCode.trim().toUpperCase()
    if (!c || !cc || cc.length !== 2) {
      return { result: null, usage }
    }
    const cityRaw = obj.city
    const city =
      typeof cityRaw === "string" && cityRaw.trim() && cityRaw.toLowerCase() !== "null"
        ? cityRaw.trim()
        : undefined
    return { result: { country: c, countryCode: cc, city }, usage }
  } catch {
    return { result: null, usage }
  }
}

function parseNullableStringField(v: unknown): string | null {
  if (v == null) return null
  if (typeof v !== "string") return null
  const t = v.trim()
  if (!t || t.toLowerCase() === "null") return null
  return t
}

function parseConfidence(v: unknown): "high" | "medium" | "low" | null {
  if (typeof v !== "string") return null
  const c = v.trim().toLowerCase()
  if (c === "high" || c === "medium" || c === "low") return c
  return null
}

async function extractLocationFromNameWithUsage(
  name: string,
  website: string,
): Promise<{ result: ExtractedHq | null; usage: ClaudeUsage }> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error("Missing ANTHROPIC_API_KEY")

  const content = `Where is this company headquartered? Use your knowledge.

Company name: ${name}
Website: ${website}

Reply with ONLY a JSON object:
{
  "country": "Full country name or null",
  "countryCode": "ISO 2-letter code or null",
  "city": "City name or null",
  "confidence": "high, medium, or low"
}

Only return a location if you are at least medium confidence.
If unsure return null for all fields.`

  const response = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 100,
      messages: [{ role: "user", content }],
    }),
  })

  const data: unknown = await response.json().catch(() => null)
  const parsed = data as {
    content?: Array<{ type?: string; text?: string }>
    usage?: { input_tokens?: number; output_tokens?: number }
  } | null

  const usage = {
    inputTokens: parsed?.usage?.input_tokens ?? 0,
    outputTokens: parsed?.usage?.output_tokens ?? 0,
  }

  if (!response.ok) {
    throw new Error(
      `Anthropic API error ${response.status}: ${JSON.stringify(
        typeof data === "object" && data && "error" in data
          ? (data as { error?: unknown }).error
          : data,
      )}`,
    )
  }

  const block = parsed?.content?.[0]
  const jsonText = block?.type === "text" ? block.text : block?.text
  if (!jsonText || typeof jsonText !== "string") {
    return { result: null, usage }
  }

  let raw = jsonText.trim()
  if (raw.startsWith("```")) {
    raw = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "")
  }

  try {
    const obj = JSON.parse(raw) as Record<string, unknown>
    const confidence = parseConfidence(obj.confidence)
    if (confidence !== "high" && confidence !== "medium") {
      return { result: null, usage }
    }

    const country = parseNullableStringField(obj.country)
    const countryCodeRaw = parseNullableStringField(obj.countryCode)
    if (!country || !countryCodeRaw) {
      return { result: null, usage }
    }
    const cc = countryCodeRaw.toUpperCase()
    if (cc.length !== 2) {
      return { result: null, usage }
    }

    const cityRaw = obj.city
    const city =
      typeof cityRaw === "string" && cityRaw.trim() && cityRaw.toLowerCase() !== "null"
        ? cityRaw.trim()
        : undefined

    return { result: { country, countryCode: cc, city }, usage }
  } catch {
    return { result: null, usage }
  }
}

function countrySlug(country: string): string {
  const s = country
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
  return s || "unknown"
}

function resolveRegion(countryCode: string): string {
  const mapped = COUNTRY_TO_REGION[countryCode.toUpperCase()]
  if (mapped && (VALID_REGIONS as readonly string[]).includes(mapped)) {
    return mapped
  }
  return "north-america"
}

async function getOrCreateLocation(
  country: string,
  countryCode: string,
  region: string,
  _city?: string,
): Promise<{ id: string; created: boolean }> {
  const slug = countrySlug(country)
  const existing = await db.location.findUnique({ where: { slug }, select: { id: true } })

  const loc = await db.location.upsert({
    where: { slug },
    update: {
      country,
      countryCode,
      region,
    },
    create: {
      name: country,
      slug,
      country,
      countryCode,
      region,
    },
    select: { id: true },
  })

  return { id: loc.id, created: !existing }
}

const UNLOCATED_FUNDER_SELECT = {
  id: true,
  name: true,
  website: true,
} as const

const UNLOCATED_FUNDER_WHERE = {
  status: "published" as const,
  AND: [{ website: { not: null } }, { website: { not: "" } }],
  locations: { none: {} },
}

async function fetchUnlocatedFunders() {
  return db.funder.findMany({
    where: UNLOCATED_FUNDER_WHERE,
    orderBy: { name: "asc" },
    select: UNLOCATED_FUNDER_SELECT,
  })
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("Missing ANTHROPIC_API_KEY")
  }

  const funders = await fetchUnlocatedFunders()

  const total = funders.length
  let successfullyLocated = 0
  let couldNotDetermine = 0
  let failed = 0
  let newLocationRecordsPass1 = 0
  let totalInputTokens = 0
  let totalOutputTokens = 0

  for (let i = 0; i < funders.length; i++) {
    const funder = funders[i]!
    const index = i + 1
    console.log(`Processing: ${funder.name} (${index}/${total})`)

    try {
      const website = funder.website?.trim() ?? ""
      if (!website) {
        couldNotDetermine++
        console.log(`Could not determine location for: ${funder.name}`)
        await delay(DELAY_MS)
        continue
      }

      const pageText = await fetchCompanyPageText(website)
      const { result, usage } = await extractLocationWithUsage(funder.name, website, pageText)
      totalInputTokens += usage.inputTokens
      totalOutputTokens += usage.outputTokens

      if (!result) {
        couldNotDetermine++
        console.log(`Could not determine location for: ${funder.name}`)
        await delay(DELAY_MS)
        continue
      }

      const region = resolveRegion(result.countryCode)
      const { id: locationId, created } = await getOrCreateLocation(
        result.country,
        result.countryCode,
        region,
        result.city,
      )
      if (created) newLocationRecordsPass1++

      await db.funderLocation.upsert({
        where: {
          funderId_locationId: {
            funderId: funder.id,
            locationId,
          },
        },
        update: {},
        create: {
          funderId: funder.id,
          locationId,
        },
      })

      successfullyLocated++
      const place =
        result.city != null && result.city !== ""
          ? `${result.city}, ${result.country}`
          : result.country
      console.log(`Located funder: ${funder.name} → ${place}`)
    } catch (err) {
      failed++
      console.error(`Error processing ${funder.name}:`, err)
    }

    await delay(DELAY_MS)
  }

  const pass2Funders = await fetchUnlocatedFunders()
  const pass2Total = pass2Funders.length
  let pass2KnowledgeLocated = 0
  let pass2CouldNotDetermine = 0
  let pass2Failed = 0
  let newLocationRecordsPass2 = 0

  for (let i = 0; i < pass2Funders.length; i++) {
    const funder = pass2Funders[i]!
    const index = i + 1
    console.log(`Pass 2 (knowledge): ${funder.name} (${index}/${pass2Total})`)

    try {
      const website = funder.website?.trim() ?? ""
      if (!website) {
        pass2CouldNotDetermine++
        console.log(`Could not determine location for: ${funder.name}`)
        await delay(DELAY_MS_KNOWLEDGE_PASS)
        continue
      }

      const { result, usage } = await extractLocationFromNameWithUsage(funder.name, website)
      totalInputTokens += usage.inputTokens
      totalOutputTokens += usage.outputTokens

      if (!result) {
        pass2CouldNotDetermine++
        console.log(`Could not determine location for: ${funder.name}`)
        await delay(DELAY_MS_KNOWLEDGE_PASS)
        continue
      }

      const region = resolveRegion(result.countryCode)
      const { id: locationId, created } = await getOrCreateLocation(
        result.country,
        result.countryCode,
        region,
        result.city,
      )
      if (created) newLocationRecordsPass2++

      await db.funderLocation.upsert({
        where: {
          funderId_locationId: {
            funderId: funder.id,
            locationId,
          },
        },
        update: {},
        create: {
          funderId: funder.id,
          locationId,
        },
      })

      pass2KnowledgeLocated++
      const place =
        result.city != null && result.city !== ""
          ? `${result.city}, ${result.country}`
          : result.country
      console.log(`Knowledge-located: ${funder.name} → ${place}`)
    } catch (err) {
      pass2Failed++
      console.error(`Pass 2 error processing ${funder.name}:`, err)
    }

    await delay(DELAY_MS_KNOWLEDGE_PASS)
  }

  const estimatedCost =
    totalInputTokens * INPUT_TOKEN_PRICE + totalOutputTokens * OUTPUT_TOKEN_PRICE

  console.log("\n--- Summary: Pass 1 (scraped pages + Claude) ---")
  console.log(`Funders processed: ${total}`)
  console.log(`Successfully located: ${successfullyLocated}`)
  console.log(`Could not determine location: ${couldNotDetermine}`)
  console.log(`Failed with error: ${failed}`)
  console.log(`New location records created: ${newLocationRecordsPass1}`)

  console.log("\n--- Summary: Pass 2 (knowledge-only) ---")
  console.log(`Funders processed: ${pass2Total}`)
  console.log(`Knowledge-located: ${pass2KnowledgeLocated}`)
  console.log(`Could not determine location: ${pass2CouldNotDetermine}`)
  console.log(`Failed with error: ${pass2Failed}`)
  console.log(`New location records created: ${newLocationRecordsPass2}`)

  console.log("\n--- Overall ---")
  console.log(
    `New location records created (total): ${newLocationRecordsPass1 + newLocationRecordsPass2}`,
  )
  console.log(`Estimated API cost (both passes): $${estimatedCost.toFixed(4)}`)
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
