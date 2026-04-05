#!/usr/bin/env bun
/**
 * Fix data quality issues for published Company records (logos, content, sectors).
 * Requires ANTHROPIC_API_KEY for passes 2–3.
 * Run: bun scripts/fix-company-profiles.ts
 */
import { db } from "~/services/db"

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages"
const MODEL = "claude-sonnet-4-20250514"
const COMBINED_TEXT_MAX = 5000
const API_DELAY_MS = 2000
const BETWEEN_COMPANIES_MS = 1000

/** Claude Sonnet 4 pricing (USD per token) — same basis as enrich-company-profiles.ts */
const INPUT_TOKEN_PRICE = 0.000_003
const OUTPUT_TOKEN_PRICE = 0.000_015

const SECTOR_SLUGS = [
  "climate-tech",
  "clean-energy",
  "environment",
  "circular-economy",
  "sustainable-food",
  "health",
  "education",
  "impact-finance",
  "community-development",
  "responsible-fashion",
  "clean-transportation",
  "built-environment",
] as const

type PassErrors = { count: number; samples: string[] }

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function normalizeBaseWebsite(website: string): string {
  const t = website.trim()
  if (!t) return t
  const withProto = /^https?:\/\//i.test(t) ? t : `https://${t}`
  return withProto.replace(/\/+$/, "")
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

async function fetchUrlPlainText(url: string): Promise<string> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15_000)
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; CauseartistBot/1.0; +https://www.causeartist.com)",
      },
    })
    if (!res.ok) return ""
    const html = await res.text()
    if (!html) return ""
    return collapseWhitespace(stripHtmlToText(html))
  } catch {
    return ""
  } finally {
    clearTimeout(timeout)
  }
}

async function fetchThreePagesForPass2(baseWebsite: string): Promise<string> {
  const base = normalizeBaseWebsite(baseWebsite)
  if (!base) return ""
  const urls = [base, `${base}/about`, `${base}/about-us`]
  const settled = await Promise.allSettled(urls.map(u => fetchUrlPlainText(u)))
  const parts: string[] = []
  for (const s of settled) {
    if (s.status === "fulfilled" && s.value) parts.push(s.value)
  }
  const combined = parts.join("\n\n")
  if (combined.length <= COMBINED_TEXT_MAX) return combined
  return combined.slice(0, COMBINED_TEXT_MAX)
}

type ContentExtract = {
  tagline: string | null
  description: string | null
  foundedYear: number | null
  founderName: string | null
}

type Usage = { inputTokens: number; outputTokens: number }

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

function parseContentExtract(text: string): ContentExtract {
  const empty: ContentExtract = {
    tagline: null,
    description: null,
    foundedYear: null,
    founderName: null,
  }
  const obj = parseJsonObject(text)
  if (!obj) return empty

  const fy = obj.foundedYear
  let foundedYear: number | null = null
  if (typeof fy === "number" && Number.isFinite(fy)) {
    foundedYear = Math.trunc(fy)
  } else if (typeof fy === "string" && /^\d{4}$/.test(fy)) {
    foundedYear = Number.parseInt(fy, 10)
  }

  return {
    tagline: typeof obj.tagline === "string" ? obj.tagline : null,
    description: typeof obj.description === "string" ? obj.description : null,
    foundedYear,
    founderName: typeof obj.founderName === "string" ? obj.founderName : null,
  }
}

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

function recordError(errors: PassErrors, message: string) {
  errors.count++
  if (errors.samples.length < 8) errors.samples.push(message)
}

function descLengthThin(description: string | null): boolean {
  if (description == null) return true
  return description.trim().length < 100
}

function hasDescriptionOrTagline(c: {
  description: string | null
  tagline: string | null
}): boolean {
  const d = c.description?.trim() ?? ""
  const t = c.tagline?.trim() ?? ""
  return d.length > 0 || t.length > 0
}

function parseSectorSlugs(text: string): string[] {
  let raw = text.trim()
  if (raw.startsWith("```")) {
    raw = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "")
  }
  try {
    const arr = JSON.parse(raw) as unknown
    if (!Array.isArray(arr)) return []
    return arr.filter((x): x is string => typeof x === "string")
  } catch {
    return []
  }
}

async function main() {
  // Debug: count what needs fixing
  const missingLogos = await db.company.count({
    where: {
      status: "published",
      website: { not: null },
      OR: [
        { logoUrl: null },
        { logoUrl: { equals: "" } },
      ],
    },
  })

  const missingDescriptions = await db.company.count({
    where: {
      status: "published",
      website: { not: null },
      OR: [
        { description: null },
        { description: { equals: "" } },
      ],
    },
  })

  const missingTaglines = await db.company.count({
    where: {
      status: "published",
      website: { not: null },
      OR: [
        { tagline: null },
        { tagline: { equals: "" } },
      ],
    },
  })

  console.log("=== DEBUG COUNTS ===")
  console.log("Missing logos:", missingLogos)
  console.log("Missing descriptions:", missingDescriptions)
  console.log("Missing taglines:", missingTaglines)
  console.log("===================")

  const logosFixed = { n: 0 }
  const contentFixed = { n: 0 }
  const pass2bFixed = { n: 0 }
  const sectorsAssigned = { n: 0 }
  let apiCalls = 0
  let totalInputTokens = 0
  let totalOutputTokens = 0

  const pass1Errors: PassErrors = { count: 0, samples: [] }
  const pass2Errors: PassErrors = { count: 0, samples: [] }
  const pass2bErrors: PassErrors = { count: 0, samples: [] }
  const pass3Errors: PassErrors = { count: 0, samples: [] }

  // --- PASS 1 ---
  const pass1Companies = await db.company.findMany({
    where: {
      status: "published",
      website: { not: null },
      OR: [{ logoUrl: null }, { logoUrl: { equals: "" } }],
    },
    select: { id: true, name: true, website: true },
  })

  for (const company of pass1Companies) {
    try {
      const website = company.website?.trim()
      if (!website) continue
      let domain: string
      try {
        domain = new URL(
          /^https?:\/\//i.test(website) ? website : `https://${website}`,
        ).hostname
      } catch {
        recordError(
          pass1Errors,
          `${company.name}: invalid website URL`,
        )
        continue
      }
      const logoUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`
      await db.company.update({
        where: { id: company.id },
        data: { logoUrl },
      })
      logosFixed.n++
      console.log(`Logo fixed: ${company.name}`)
    } catch (e) {
      recordError(
        pass1Errors,
        `${company.name}: ${e instanceof Error ? e.message : String(e)}`,
      )
      console.error(`Pass 1 error (${company.name}):`, e)
    }
  }

  // --- PASS 2 ---
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("\nSkipping passes 2–3: ANTHROPIC_API_KEY is not set.\n")
  } else {
    const pass2Select = {
      id: true,
      name: true,
      website: true,
      description: true,
      tagline: true,
      foundedYear: true,
      founderName: true,
    } as const

    const pass2FromOrClause = await db.company.findMany({
      where: {
        status: "published",
        website: { not: null },
        OR: [
          { tagline: null },
          { description: null },
          { description: { equals: "" } },
          { tagline: { equals: "" } },
        ],
      },
      select: pass2Select,
    })

    const allCompaniesWithWebsite = await db.company.findMany({
      where: {
        status: "published",
        website: { not: null },
      },
      select: pass2Select,
    })

    const thinDescriptions = allCompaniesWithWebsite.filter(
      c => !c.description || c.description.length < 100,
    )

    const pass2Companies = Array.from(
      new Map(
        [...pass2FromOrClause, ...thinDescriptions].map(c => [c.id, c]),
      ).values(),
    )

    for (let i = 0; i < pass2Companies.length; i++) {
      if (i > 0) await delay(BETWEEN_COMPANIES_MS)

      const company = pass2Companies[i]!
      try {
        const website = company.website?.trim()
        if (!website) continue

        const combinedText = await fetchThreePagesForPass2(website)
        if (!combinedText.trim()) {
          recordError(pass2Errors, `${company.name}: no fetchable page text`)
          continue
        }

        const userMessage = `Extract information about this company.

Company: ${company.name}
Website: ${company.website}

Content:
${combinedText}

Return ONLY a JSON object:
{
  "tagline": "One compelling sentence (max 15 words) describing 
    what the company does and their impact. No fluff.",
  "description": "Write 3 paragraphs separated by \\n\\n.
    Paragraph 1: What they do and their products/services.
    Paragraph 2: Their mission and founding story.
    Paragraph 3: Their impact on the world.
    Minimum 150 words total.",
  "foundedYear": number or null,
  "founderName": "Founder name(s) or null"
}`

        const { text, usage } = await anthropicMessages(userMessage, 800)
        apiCalls++
        totalInputTokens += usage.inputTokens
        totalOutputTokens += usage.outputTokens
        await delay(API_DELAY_MS)

        const extracted = parseContentExtract(text)

        const data: {
          tagline?: string
          description?: string
          foundedYear?: number | null
          founderName?: string | null
        } = {}

        if (extracted.tagline != null && extracted.tagline.trim() !== "") {
          data.tagline = extracted.tagline.trim()
        }

        if (descLengthThin(company.description) && extracted.description != null) {
          data.description = extracted.description
        }

        if (company.foundedYear == null && extracted.foundedYear != null) {
          data.foundedYear = extracted.foundedYear
        }

        if (company.founderName == null && extracted.founderName != null) {
          data.founderName = extracted.founderName
        }

        if (Object.keys(data).length === 0) {
          recordError(pass2Errors, `${company.name}: nothing to apply from API`)
          continue
        }

        await db.company.update({
          where: { id: company.id },
          data,
        })
        contentFixed.n++
        console.log(`Content fixed: ${company.name}`)
      } catch (e) {
        recordError(
          pass2Errors,
          `${company.name}: ${e instanceof Error ? e.message : String(e)}`,
        )
        console.error(`Pass 2 error (${company.name}):`, e)
        await delay(API_DELAY_MS)
      }
    }

    // --- PASS 2b (knowledge fallback: no page fetch) ---
    const pass2bCompanies = await db.company.findMany({
      where: {
        status: "published",
        website: { not: null },
        OR: [{ description: null }, { description: { equals: "" } }],
      },
      select: pass2Select,
    })

    for (let i = 0; i < pass2bCompanies.length; i++) {
      const company = pass2bCompanies[i]!
      try {
        const website = company.website?.trim()
        if (!website) continue

        const userMessage = `Using your knowledge, provide information about this company.

Company name: ${company.name}
Website: ${company.website}

Return ONLY a JSON object:
{
  "tagline": "One compelling sentence max 15 words describing 
    what they do and their impact",
  "description": "Write 3 paragraphs separated by \\n\\n.
    Paragraph 1: What they do and their products/services.
    Paragraph 2: Their mission and founding story.  
    Paragraph 3: Their impact on the world.
    Minimum 100 words total.
    If you have no knowledge of this company return null.",
  "foundedYear": number or null,
  "founderName": "Founder name or null"
}

Only return information you are confident about.
If you have no knowledge of this company set description to null.`

        const { text, usage } = await anthropicMessages(userMessage, 800)
        apiCalls++
        totalInputTokens += usage.inputTokens
        totalOutputTokens += usage.outputTokens

        const extracted = parseContentExtract(text)
        const descTrimmed = extracted.description?.trim() ?? ""
        if (extracted.description == null || descTrimmed === "") {
          console.log(`No knowledge found for: ${company.name}`)
          await delay(1000)
          continue
        }

        const data: {
          tagline?: string
          description?: string
          foundedYear?: number | null
          founderName?: string | null
        } = {}

        if (extracted.tagline != null && extracted.tagline.trim() !== "") {
          data.tagline = extracted.tagline.trim()
        }

        data.description = descTrimmed

        if (company.foundedYear == null && extracted.foundedYear != null) {
          data.foundedYear = extracted.foundedYear
        }

        if (company.founderName == null && extracted.founderName != null) {
          data.founderName = extracted.founderName
        }

        await db.company.update({
          where: { id: company.id },
          data,
        })
        pass2bFixed.n++
        console.log(`Knowledge-filled: ${company.name}`)
        await delay(1000)
      } catch (e) {
        recordError(
          pass2bErrors,
          `${company.name}: ${e instanceof Error ? e.message : String(e)}`,
        )
        console.error(`Pass 2b error (${company.name}):`, e)
        await delay(1000)
      }
    }

    // --- PASS 3 ---
    const pass3Candidates = await db.company.findMany({
      where: {
        status: "published",
        sectors: { none: {} },
      },
      select: {
        id: true,
        name: true,
        description: true,
        tagline: true,
      },
    })

    const pass3Companies = pass3Candidates.filter(hasDescriptionOrTagline)

    const allowedSlugs = new Set<string>(SECTOR_SLUGS)

    for (let i = 0; i < pass3Companies.length; i++) {
      if (i > 0) await delay(BETWEEN_COMPANIES_MS)

      const company = pass3Companies[i]!
      try {
        const descOrTag =
          company.description?.trim() ||
          company.tagline?.trim() ||
          ""

        const slugList = SECTOR_SLUGS.map(s => `- ${s}`).join("\n")

        const userMessage = `Classify this impact company into 1-3 sectors.

Company: ${company.name}
Description: ${descOrTag}

Available sectors (use ONLY these exact slugs):
${slugList}

Return ONLY a JSON array of 1-3 sector slugs:
["sector-slug-1", "sector-slug-2"]`

        const { text, usage } = await anthropicMessages(userMessage, 800)
        apiCalls++
        totalInputTokens += usage.inputTokens
        totalOutputTokens += usage.outputTokens
        await delay(API_DELAY_MS)

        const slugs = parseSectorSlugs(text).filter(s => allowedSlugs.has(s))
        if (slugs.length === 0) {
          recordError(pass3Errors, `${company.name}: no valid sector slugs in response`)
          continue
        }

        for (const slug of slugs) {
          const sector = await db.sector.findUnique({ where: { slug } })
          if (!sector) {
            recordError(pass3Errors, `${company.name}: sector not in DB: ${slug}`)
            continue
          }
          await db.companySector.createMany({
            data: [{ companyId: company.id, sectorId: sector.id }],
            skipDuplicates: true,
          })
          sectorsAssigned.n++
          console.log(`Sector assigned: ${company.name} → ${sector.name}`)
        }
      } catch (e) {
        recordError(
          pass3Errors,
          `${company.name}: ${e instanceof Error ? e.message : String(e)}`,
        )
        console.error(`Pass 3 error (${company.name}):`, e)
        await delay(API_DELAY_MS)
      }
    }
  }

  const inputCost = totalInputTokens * INPUT_TOKEN_PRICE
  const outputCost = totalOutputTokens * OUTPUT_TOKEN_PRICE
  const estimatedCost = inputCost + outputCost

  console.log("\n--- PASS 4: Summary ---")
  console.log(`Logos fixed: ${logosFixed.n}`)
  console.log(`Descriptions/taglines (content) fixed: ${contentFixed.n}`)
  console.log(`Pass 2b (knowledge fallback) fixed: ${pass2bFixed.n}`)
  console.log(`Sector rows assigned: ${sectorsAssigned.n}`)
  console.log(`API calls made: ${apiCalls}`)
  console.log(`Estimated cost (input/output tokens × list price): $${estimatedCost.toFixed(4)}`)
  console.log(`Input tokens: ${totalInputTokens} | Output tokens: ${totalOutputTokens}`)
  console.log("\nErrors per pass:")
  for (const [label, err] of [
    ["Pass 1", pass1Errors],
    ["Pass 2", pass2Errors],
    ["Pass 2b", pass2bErrors],
    ["Pass 3", pass3Errors],
  ] as const) {
    console.log(`  ${label}: ${err.count}`)
    for (const s of err.samples) console.log(`    - ${s}`)
  }
}

main()
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
