#!/usr/bin/env bun
/**
 * Scrape a funder portfolio page, extract companies via Claude, link or create companies.
 *
 * Usage:
 *   bun scripts/scrape-funder-portfolio.ts --funder "acumen" --url "https://acumen.org/companies/"
 */
import type { Prisma } from "~/.generated/prisma/client"
import { generateUniqueSlug } from "~/lib/slugs"
import { db } from "~/services/db"

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages"
const MODEL = "claude-sonnet-4-20250514"

type ExtractedPortfolioCompany = {
  name: string
  website: string | null
  description: string | null
}

function parseCliArgs() {
  const args = process.argv.slice(2)
  let funder: string | undefined
  let url: string | undefined
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--funder" && args[i + 1]) {
      funder = args[++i]
      continue
    }
    if (args[i] === "--url" && args[i + 1]) {
      url = args[++i]
      continue
    }
  }
  return { funder, url }
}

function printUsageAndExit(): never {
  console.error(`Usage:
  bun scripts/scrape-funder-portfolio.ts --funder "<slug>" --url "<portfolio page URL>"

Example:
  bun scripts/scrape-funder-portfolio.ts --funder "acumen" --url "https://acumen.org/companies/"`)
  process.exit(1)
}

async function fetchPageHtml(pageUrl: string): Promise<string> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15_000)
  try {
    const res = await fetch(pageUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; CauseartistPortfolioBot/1.0; +https://causeartist.com)",
      },
    })
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`)
    }
    return await res.text()
  } finally {
    clearTimeout(timeout)
  }
}

function htmlToPlainText(html: string): string {
  let text = html
  text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
  text = text.replace(/<[^>]+>/g, " ")
  text = text.replace(/\s+/g, " ").trim()
  return text.length > 16_000 ? text.slice(0, 16_000) : text
}

function getAnthropicText(data: unknown): string | null {
  const parsed = data as {
    content?: Array<{ type?: string; text?: string }>
  } | null
  const blocks = parsed?.content
  if (!blocks?.length) return null
  const texts = blocks
    .map(b => (typeof b?.text === "string" ? b.text : ""))
    .filter(Boolean)
  return texts.length ? texts.join("") : null
}

/**
 * If the model hits max_tokens, JSON may end mid-string. Drop the incomplete last object and close the array.
 */
function tryRepairTruncatedJsonArray(t: string): string {
  const s = t.trim()
  if (!s.startsWith("[")) return t

  let depth = 0
  let inString = false
  let escape = false
  let lastObjectEnd = -1

  for (let i = 0; i < s.length; i++) {
    const c = s[i]!

    if (escape) {
      escape = false
      continue
    }
    if (c === "\\" && inString) {
      escape = true
      continue
    }
    if (c === '"' && !escape) {
      inString = !inString
      continue
    }
    if (inString) continue

    if (c === "{") depth++
    else if (c === "}") {
      depth--
      if (depth === 0) lastObjectEnd = i
    }
  }

  if (lastObjectEnd >= 0) {
    const body = s.slice(0, lastObjectEnd + 1).replace(/,\s*$/, "")
    return `${body}]`
  }
  return t
}

function parseJsonArrayFromClaude(raw: string): ExtractedPortfolioCompany[] {
  let t = raw.trim()
  const fence = /^```(?:json)?\s*([\s\S]*?)```$/m.exec(t)
  if (fence) t = fence[1].trim()

  let parsed: unknown
  try {
    parsed = JSON.parse(t)
  } catch {
    parsed = JSON.parse(tryRepairTruncatedJsonArray(t))
  }
  if (!Array.isArray(parsed)) {
    throw new Error("Claude response is not a JSON array")
  }

  const out: ExtractedPortfolioCompany[] = []
  for (const item of parsed) {
    if (!item || typeof item !== "object") continue
    const o = item as Record<string, unknown>
    const name = typeof o.name === "string" ? o.name.trim() : ""
    if (!name) continue

    let website: string | null = null
    if (o.website != null && o.website !== "null") {
      const w = String(o.website).trim()
      website = w.length > 0 ? w : null
    }

    let description: string | null = null
    if (o.description != null && o.description !== "null") {
      const d = String(o.description).trim()
      description = d.length > 0 ? d : null
    }

    out.push({ name, website, description })
  }
  return out
}

async function extractPortfolioCompanies(
  apiKey: string,
  funderName: string,
  pageText: string,
): Promise<ExtractedPortfolioCompany[]> {
  const content = `This is content from ${funderName}'s portfolio page.

Extract all portfolio companies mentioned. For each company find:
- Company name
- Website URL if visible on the page
- Brief description if available

Page content:
${pageText}

Return ONLY a JSON array, no markdown, no explanation:
[
  {
    "name": "Company Name",
    "website": "https://www.example.com or null",
    "description": "Brief description or null"
  }
]

If no companies found return: []`

  const res = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 16_384,
      messages: [{ role: "user", content }],
    }),
  })

  const data: unknown = await res.json().catch(() => null)

  if (!res.ok) {
    const errText =
      typeof data === "object" && data !== null && "error" in data
        ? JSON.stringify((data as { error?: unknown }).error)
        : String(data)
    throw new Error(`Anthropic API error ${res.status}: ${errText}`)
  }

  const jsonText = getAnthropicText(data)
  if (!jsonText || typeof jsonText !== "string") {
    throw new Error("Anthropic response missing text content")
  }

  try {
    return parseJsonArrayFromClaude(jsonText)
  } catch (e) {
    console.error("Failed to parse Claude JSON. Raw snippet:\n", jsonText.slice(0, 500))
    throw e
  }
}

function buildCompanyLookupWhere(name: string, website: string | null): Prisma.CompanyWhereInput {
  const or: Prisma.CompanyWhereInput[] = [
    { name: { contains: name, mode: "insensitive" } },
  ]
  if (website) {
    const trimmed = website.trim()
    if (trimmed) {
      try {
        const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
        const host = new URL(withProtocol).hostname.replace(/^www\./i, "")
        if (host) {
          or.push({ website: { contains: host, mode: "insensitive" } })
        }
      } catch {
        or.push({ website: { contains: trimmed, mode: "insensitive" } })
      }
    }
  }
  return { OR: or }
}

async function main() {
  const { funder: funderSlug, url: portfolioUrl } = parseCliArgs()
  if (!funderSlug || !portfolioUrl) {
    printUsageAndExit()
  }

  const anthropicApiKey = process.env.ANTHROPIC_API_KEY
  if (!anthropicApiKey) {
    console.error("Missing ANTHROPIC_API_KEY")
    process.exit(1)
  }

  const funder = await db.funder.findUnique({
    where: { slug: funderSlug },
    select: { id: true, name: true, slug: true },
  })

  if (!funder) {
    console.error(`Funder '${funderSlug}' not found in database. Check the slug and try again.`)
    process.exit(1)
  }

  console.log(`Funder: ${funder.name} (${funder.slug})`)
  console.log(`Fetching: ${portfolioUrl}\n`)

  const html = await fetchPageHtml(portfolioUrl)
  const pageText = htmlToPlainText(html)

  const extracted = await extractPortfolioCompanies(anthropicApiKey, funder.name, pageText)

  if (!Array.isArray(extracted)) {
    console.error("Extraction did not return an array")
    process.exit(1)
  }

  let alreadyExistedLinked = 0
  let newDraftLinked = 0
  let failed = 0
  let newJunctionRows = 0

  for (const company of extracted) {
    try {
      console.log(`Found: ${company.name} (${company.website ?? "no website"})`)

      const existing = await db.company.findFirst({
        where: buildCompanyLookupWhere(company.name, company.website),
        select: { id: true, name: true },
      })

      let companyId: string

      if (existing) {
        companyId = existing.id
        alreadyExistedLinked++
      } else {
        const slug = await generateUniqueSlug(
          company.name,
          s => db.company.findUnique({ where: { slug: s }, select: { id: true } }).then(Boolean),
        )

        await db.company.create({
          data: {
            name: company.name,
            slug,
            status: "draft",
            website: company.website,
            description: company.description,
            tagline: null,
          },
        })

        const created = await db.company.findUnique({
          where: { slug },
          select: { id: true },
        })
        if (!created) throw new Error("Create succeeded but company not found")
        companyId = created.id
        newDraftLinked++
      }

      const hadLink = await db.companyFunder.findUnique({
        where: {
          companyId_funderId: {
            companyId,
            funderId: funder.id,
          },
        },
        select: { companyId: true },
      })

      await db.companyFunder.upsert({
        where: {
          companyId_funderId: {
            companyId,
            funderId: funder.id,
          },
        },
        update: {},
        create: {
          companyId,
          funderId: funder.id,
        },
      })

      if (!hadLink) {
        newJunctionRows++
      }

      if (existing) {
        console.log(`✓ Linked existing: ${existing.name} → ${funder.name}`)
      } else {
        console.log(`✓ Created new draft + linked: ${company.name} → ${funder.name}`)
      }
    } catch (e) {
      failed++
      console.error(`✗ Failed: ${company.name}`, e)
    }
  }

  console.log("\n--- Summary ---")
  console.log("Funder:", funder.name)
  console.log("Portfolio page:", portfolioUrl)
  console.log("Total companies found on page:", extracted.length)
  console.log("Already existed in database (linked):", alreadyExistedLinked)
  console.log("New companies created as draft (linked):", newDraftLinked)
  console.log("Failed to process:", failed)
  console.log("Total new CompanyFunder relationships created:", newJunctionRows)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
