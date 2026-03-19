#!/usr/bin/env node
import fs from "node:fs"
import path from "node:path"
import { db } from "~/services/db"

const anthropicKey = process.env.ANTHROPIC_API_KEY
if (!anthropicKey) {
  throw new Error("Missing required env var ANTHROPIC_API_KEY")
}
// After the early throw above, this is guaranteed to be defined at runtime.
const anthropicApiKey: string = anthropicKey

const allowedSectors = [
  "clean-energy",
  "sustainable-food",
  "impact-finance",
  "climate-tech",
  "health",
  "education",
  "circular-economy",
  "social-enterprise",
  "community-development",
  "environment",
] as const

const allowedSectorSet = new Set<string>(allowedSectors)

type ExtractedCompanyData = {
  name: string
  tagline?: string
  description: string
  website: string
  foundedYear: number | null
  location: string | null
  sectors: string[]
  linkedin: string | null
  twitter: string | null
  founderName: string | null
  logoUrl: string | null
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function slugifyName(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

function prettifySectorName(sectorSlug: string) {
  return sectorSlug
    .split("-")
    .filter(Boolean)
    .map(part => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(" ")
}

function parseSingleColumnCsvUrls(raw: string) {
  const lines = raw
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean)

  // Skip header row
  lines.shift()

  const urls: string[] = []
  for (const line of lines) {
    const firstColumn = line.split(",")[0]?.trim() ?? ""
    const unquoted = firstColumn.replace(/^"|"$/g, "")
    if (!unquoted) continue
    urls.push(unquoted)
  }

  return urls
}

function parseCsvRow(line: string): string[] {
  const out: string[] = []
  let cur = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]

    if (ch === '"') {
      const next = line[i + 1]
      if (inQuotes && next === '"') {
        // Escaped quote in CSV: "" -> "
        cur += '"'
        i++
        continue
      }
      inQuotes = !inQuotes
      continue
    }

    if (ch === "," && !inQuotes) {
      out.push(cur.trim())
      cur = ""
      continue
    }

    cur += ch
  }

  out.push(cur.trim())
  return out
}

type CompanyCsvRow = {
  url: string
  companyName: string
  primaryCategory: string
  subcategories: string[]
}

type FunderCsvRow = {
  url: string
  funderName: string
  primaryCategory: string
  subcategories: string[]
}

function parseSubcategoryValues(rawSubcategory: string, rawSecondaryTags: string): string[] {
  const fromSubcategory = rawSubcategory
    .split(/[;,|]/)
    .map(v => v.trim())
    .filter(Boolean)

  const fromSecondaryTags = rawSecondaryTags
    .split(/[;,|]/)
    .map(v => v.trim())
    .filter(Boolean)

  const merged = [...fromSubcategory, ...fromSecondaryTags]
  return Array.from(new Set(merged))
}

function parseCompaniesCsv(raw: string): CompanyCsvRow[] {
  const lines = raw.split(/\r?\n/).filter(l => l.trim())
  if (lines.length === 0) return []

  const headerRow = parseCsvRow(lines[0])
  const headerMap = new Map<string, number>()
  for (let i = 0; i < headerRow.length; i++) {
    headerMap.set(headerRow[i]?.trim(), i)
  }

  const websiteUrlIdx = headerMap.get("Website URL")
  const companyNameIdx = headerMap.get("Company Name")
  const primaryCategoryIdx = headerMap.get("Primary Category")
  const subcategoryIdx = headerMap.get("Subcategory")
  const secondaryTagsIdx = headerMap.get("Secondary Tags")

  const hasRequired =
    websiteUrlIdx != null && companyNameIdx != null && primaryCategoryIdx != null
  if (!hasRequired) {
    throw new Error(
      "companies.csv header missing required columns: 'Company Name', 'Website URL', 'Primary Category'",
    )
  }

  const rows: CompanyCsvRow[] = []
  for (const line of lines.slice(1)) {
    const cols = parseCsvRow(line)
    const url = (cols[websiteUrlIdx] ?? "").trim().replace(/^"|"$/g, "")
    if (!url) continue

    rows.push({
      url,
      companyName: (cols[companyNameIdx] ?? "").trim().replace(/^"|"$/g, ""),
      primaryCategory: (cols[primaryCategoryIdx] ?? "")
        .trim()
        .replace(/^"|"$/g, ""),
      subcategories: parseSubcategoryValues(
        (subcategoryIdx != null ? cols[subcategoryIdx] : "") ?? "",
        (secondaryTagsIdx != null ? cols[secondaryTagsIdx] : "") ?? "",
      ),
    })
  }

  return rows
}

function stripHtmlAndClean(text: string) {
  const withoutTags = text.replace(/<[^>]*>/g, " ")
  return withoutTags.replace(/\s+/g, " ").trim().slice(0, 3000)
}

function extractFaviconUrl(pageUrl: string, html: string): string {
  const googleFallback = (() => {
    try {
      const domain = new URL(pageUrl).hostname
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`
    } catch {
      return "https://www.google.com/s2/favicons?domain=&sz=128"
    }
  })()

  const links = html.match(/<link\b[^>]*>/gi) ?? []

  const parseAttr = (tag: string, attr: string) => {
    return (
      new RegExp(`${attr}\\s*=\\s*["']([^"']+)["']`, "i").exec(tag)?.[1]?.trim() ??
      ""
    )
  }

  const getHref = (tag: string) => parseAttr(tag, "href")
  const getRel = (tag: string) => parseAttr(tag, "rel").toLowerCase()
  const getSizes = (tag: string) => parseAttr(tag, "sizes")

  const toAbsoluteIfRootRelative = (faviconUrl: string) => {
    if (!faviconUrl) return ""
    if (!faviconUrl.startsWith("/")) return faviconUrl

    const base = new URL(pageUrl)
    return `${base.protocol}//${base.hostname}${faviconUrl}`
  }

  const hasRelToken = (rel: string, token: string) => rel.split(/\s+/).includes(token)

  // 1) apple-touch-icon
  for (const tag of links) {
    const rel = getRel(tag)
    if (!rel) continue
    if (hasRelToken(rel, "apple-touch-icon")) {
      const href = getHref(tag)
      if (href) return toAbsoluteIfRootRelative(href)
    }
  }

  // 2) rel=icon with sizes 192x192 or 180x180
  for (const tag of links) {
    const rel = getRel(tag)
    if (!rel) continue
    if (!hasRelToken(rel, "icon")) continue

    const sizes = getSizes(tag)
    if (sizes !== "192x192" && sizes !== "180x180") continue

    const href = getHref(tag)
    if (href) return toAbsoluteIfRootRelative(href)
  }

  // 3) shortcut icon
  for (const tag of links) {
    const rel = getRel(tag)
    if (!rel) continue
    const shortcutIcon = rel.includes("shortcut") && rel.includes("icon")
    if (!shortcutIcon) continue

    const href = getHref(tag)
    if (href) return toAbsoluteIfRootRelative(href)
  }

  // 4) any rel=icon
  for (const tag of links) {
    const rel = getRel(tag)
    if (!rel) continue
    if (!hasRelToken(rel, "icon")) continue

    const href = getHref(tag)
    if (href) return toAbsoluteIfRootRelative(href)
  }

  // 5) Google fallback
  return googleFallback
}

async function fetchHtmlText(url: string, timeoutMs = 10_000) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(url, { signal: controller.signal })
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`)
    }
    return await res.text()
  } finally {
    clearTimeout(timeout)
  }
}

async function extractClaudeCompanyData({
  url,
  cleanedText,
  ogTitle,
  ogDescription,
  ogImage,
  twitterDescription,
  metaDescription,
  knownName,
  knownNameLabel,
  knownPrimaryCategory,
}: {
  url: string
  cleanedText: string
  ogTitle: string
  ogDescription: string
  ogImage: string
  twitterDescription: string
  metaDescription: string
  knownName: string
  knownNameLabel: "company" | "funder"
  knownPrimaryCategory: string
}) {
  const prompt = `Extract company information from this website text and return ONLY a JSON object with no markdown, no backticks, no explanation. Just raw JSON.

Website URL: ${url}

Known ${knownNameLabel} name: ${knownName}
Known category: ${knownPrimaryCategory}

Page meta data:
og:title: ${ogTitle}
og:description: ${ogDescription}
og:image: ${ogImage}
twitter:description: ${twitterDescription}
meta:description: ${metaDescription}

Page text (truncated):
${cleanedText}

Return this exact JSON structure:
{
  "name": "company name",
  "tagline": "one sentence tagline or value proposition",
  "description": "2-3 sentence description of what they do",
  "website": "${url}",
  "foundedYear": null or number,
  "location": "City, Country or null",
  "sectors": ["sector1", "sector2"],
  "linkedin": "full linkedin URL or null",
  "twitter": "full twitter/x URL or null",
  "founderName": "founder name or null",
  "logoUrl": "full URL to logo image or null"
}

Rules:
- sectors must be from this list only: clean-energy, sustainable-food, impact-finance, climate-tech, health, education, circular-economy, social-enterprise, community-development, environment
- if you cannot find a value leave it as null
- return ONLY the JSON object, nothing else
- return ONLY the JSON object, nothing else`

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": anthropicApiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  })

  if (!response.ok) {
    const text = await response.text().catch(() => "")
    throw new Error(`Anthropic error: HTTP ${response.status} ${response.statusText} ${text}`.trim())
  }

  const data: unknown = await response.json()

  const parsed = data as {
    content?: { text?: string }[]
    usage?: { input_tokens?: number; output_tokens?: number }
  }

  const jsonText = parsed.content?.[0]?.text
  if (!jsonText) {
    throw new Error("Anthropic response missing content[0].text")
  }

  const usageInput = parsed.usage?.input_tokens
  const usageOutput = parsed.usage?.output_tokens

  return {
    jsonText,
    usage: {
      inputTokens: usageInput ?? 0,
      outputTokens: usageOutput ?? 0,
    },
  }
}

async function upsertCompanyAndSectors({
  url,
  extracted,
  subcategoryNames,
}: {
  url: string
  extracted: ExtractedCompanyData
  subcategoryNames: string[]
}) {
  const slug = slugifyName(extracted.name)
  if (!slug) throw new Error("Could not generate slug from extracted company name")

  const company = await db.company.upsert({
    where: { slug },
    create: {
      name: extracted.name,
      slug,
      status: "draft",
      tagline: extracted.tagline ?? null,
      description: extracted.description,
      website: extracted.website || url,
      foundedYear: extracted.foundedYear ?? null,
      linkedin: extracted.linkedin ?? null,
      twitter: extracted.twitter ?? null,
      founderName: extracted.founderName ?? null,
      logoUrl: extracted.logoUrl ?? null,
    },
    update: {
      name: extracted.name,
      status: "draft",
      tagline: extracted.tagline ?? null,
      description: extracted.description,
      website: extracted.website || url,
      foundedYear: extracted.foundedYear ?? null,
      linkedin: extracted.linkedin ?? null,
      twitter: extracted.twitter ?? null,
      founderName: extracted.founderName ?? null,
      logoUrl: extracted.logoUrl ?? null,
    },
    select: { id: true },
  })

  const sectors = extracted.sectors?.filter(s => allowedSectorSet.has(s)) ?? []
  for (const sectorSlug of sectors) {
    const sector = await db.sector.upsert({
      where: { slug: sectorSlug },
      update: {},
      create: {
        name: sectorSlug
          .split("-")
          .map(w => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" "),
        slug: sectorSlug,
      },
      select: { id: true },
    })

    // Junction uses composite key (companyId, sectorId), so just create after upserting sector.
    await db.companySector.create({
      data: {
        companyId: company.id,
        sectorId: sector.id,
      },
    }).catch(() => {
      // If it already exists, don't treat as a failure for re-runs.
    })
  }

  for (const subcategoryName of subcategoryNames) {
    const cleanName = subcategoryName.trim()
    if (!cleanName) continue

    const subcategorySlug = slugifyName(cleanName)
    if (!subcategorySlug) continue

    const subcategory = await db.subcategory.upsert({
      where: { slug: subcategorySlug },
      update: {},
      create: {
        name: cleanName,
        slug: subcategorySlug,
      },
      select: { id: true },
    })

    await db.companySubcategory.create({
      data: {
        companyId: company.id,
        subcategoryId: subcategory.id,
      },
    }).catch(() => {
      // If it already exists, don't treat as a failure for re-runs.
    })
  }
}

async function upsertFunderAndSectors({
  url,
  extracted,
  subcategoryNames,
}: {
  url: string
  extracted: ExtractedCompanyData
  subcategoryNames: string[]
}) {
  const slug = slugifyName(extracted.name)
  if (!slug) throw new Error("Could not generate slug from extracted funder name")

  const funder = await db.funder.upsert({
    where: { slug },
    create: {
      name: extracted.name,
      slug,
      status: "draft",
      description: extracted.description,
      website: extracted.website || url,
      foundedYear: extracted.foundedYear ?? null,
      linkedin: extracted.linkedin ?? null,
      logoUrl: extracted.logoUrl ?? null,
    },
    update: {
      name: extracted.name,
      status: "draft",
      description: extracted.description,
      website: extracted.website || url,
      foundedYear: extracted.foundedYear ?? null,
      linkedin: extracted.linkedin ?? null,
      logoUrl: extracted.logoUrl ?? null,
    },
    select: { id: true },
  })

  const sectors = extracted.sectors?.filter(s => allowedSectorSet.has(s)) ?? []
  for (const sectorSlug of sectors) {
    const sector = await db.sector.upsert({
      where: { slug: sectorSlug },
      update: {},
      create: {
        name: sectorSlug
          .split("-")
          .map(w => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" "),
        slug: sectorSlug,
      },
      select: { id: true },
    })

    await db.funderSector.create({
      data: {
        funderId: funder.id,
        sectorId: sector.id,
      },
    }).catch(() => {
      // If it already exists, don't treat as a failure for re-runs.
    })
  }

  for (const subcategoryName of subcategoryNames) {
    const cleanName = subcategoryName.trim()
    if (!cleanName) continue

    const subcategorySlug = slugifyName(cleanName)
    if (!subcategorySlug) continue

    const subcategory = await db.subcategory.upsert({
      where: { slug: subcategorySlug },
      update: {},
      create: {
        name: cleanName,
        slug: subcategorySlug,
      },
      select: { id: true },
    })

    await db.funderSubcategory.create({
      data: {
        funderId: funder.id,
        subcategoryId: subcategory.id,
      },
    }).catch(() => {
      // If it already exists, don't treat as a failure for re-runs.
    })
  }
}

async function processUrlsAsCompanies(companyUrls: CompanyCsvRow[]) {
  let companiesProcessed = 0
  let companiesCreated = 0
  let companiesSkipped = 0
  let companiesFailed = 0

  let totalApiCalls = 0
  let totalInputTokens = 0
  let totalOutputTokens = 0

  for (const company of companyUrls) {
    const url = company.url
    try {
      const exists = await db.company.findFirst({
        where: { website: url },
        select: { id: true, name: true },
      })

      if (exists) {
        companiesSkipped++
        console.log(`Skipping creation: ${url} already exists`)

        for (const subcategoryName of company.subcategories) {
          const cleanName = subcategoryName.trim()
          if (!cleanName) continue

          const subcategorySlug = slugifyName(cleanName)
          if (!subcategorySlug) continue

          const subcategory = await db.subcategory.upsert({
            where: { slug: subcategorySlug },
            update: {},
            create: {
              name: cleanName,
              slug: subcategorySlug,
            },
            select: { id: true },
          })

          await db.companySubcategory.create({
            data: {
              companyId: exists.id,
              subcategoryId: subcategory.id,
            },
          }).catch(() => {
            // If it already exists, don't treat as a failure for re-runs.
          })
        }

        console.log(`Updated subcategories for: ${exists.name}`)
        continue
      }

      companiesProcessed++

      const rawHtml = await fetchHtmlText(url, 10_000)

      const faviconUrl = extractFaviconUrl(url, rawHtml)

      const ogTitle =
        rawHtml.match(/<meta[^>]*property="og:title"[^>]*content="([^"]*)"/)?.[1] ?? ""
      const ogDescription =
        rawHtml.match(/<meta[^>]*property="og:description"[^>]*content="([^"]*)"/)?.[1] ??
        ""
      const ogImage =
        rawHtml.match(/<meta[^>]*property="og:image"[^>]*content="([^"]*)"/)?.[1] ?? ""
      const twitterDescription =
        rawHtml.match(
          /<meta[^>]*name="twitter:description"[^>]*content="([^"]*)"/,
        )?.[1] ?? ""
      const metaDescription =
        rawHtml.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"/)?.[1] ?? ""

      const cleanedText = stripHtmlAndClean(rawHtml)

      const { jsonText, usage } = await extractClaudeCompanyData({
        url,
        cleanedText,
        ogTitle,
        ogDescription,
        ogImage,
        twitterDescription,
        metaDescription,
        knownName: company.companyName,
        knownNameLabel: "company",
        knownPrimaryCategory: company.primaryCategory,
      })
      totalApiCalls++
      totalInputTokens += usage.inputTokens
      totalOutputTokens += usage.outputTokens

      let extracted: ExtractedCompanyData
      try {
        const parsed = JSON.parse(jsonText) as Partial<ExtractedCompanyData>
        const safeName =
          parsed.name && String(parsed.name).trim()
            ? String(parsed.name).trim()
            : company.companyName?.trim() || ""

        if (!safeName) throw new Error("Missing extracted company name")

        extracted = parsed as ExtractedCompanyData
        extracted.name = safeName
      } catch (e) {
        throw new Error(`Failed to parse Anthropic JSON: ${String(e)}`)
      }

      const sectors = extracted.sectors ?? []
      if (!Array.isArray(sectors)) throw new Error("Extracted sectors was not an array")

      // Always override with favicon-derived logo to avoid large hero images.
      extracted.logoUrl = faviconUrl

      await upsertCompanyAndSectors({
        url,
        extracted,
        subcategoryNames: company.subcategories,
      })

      companiesCreated++
      console.log(`Created draft Company: ${url}`)
    } catch (e) {
      companiesFailed++
      console.error(`Company URL failed: ${url}`, e)
    }

    // Rate limiting between API calls
    await delay(2000)
  }

  return {
    companiesProcessed,
    companiesCreated,
    companiesSkipped,
    companiesFailed,
    totalApiCalls,
    totalInputTokens,
    totalOutputTokens,
  }
}

async function processUrlsAsFunders(funderUrls: FunderCsvRow[]) {
  let fundersProcessed = 0
  let fundersCreated = 0
  let fundersSkipped = 0
  let fundersFailed = 0

  let totalApiCalls = 0
  let totalInputTokens = 0
  let totalOutputTokens = 0

  for (const funder of funderUrls) {
    const url = funder.url
    try {
      const exists = await db.funder.findFirst({
        where: { website: url },
        select: { id: true, name: true },
      })

      if (exists) {
        fundersSkipped++
        console.log(`Skipping creation: ${url} already exists`)

        for (const subcategoryName of funder.subcategories) {
          const cleanName = subcategoryName.trim()
          if (!cleanName) continue

          const subcategorySlug = slugifyName(cleanName)
          if (!subcategorySlug) continue

          const subcategory = await db.subcategory.upsert({
            where: { slug: subcategorySlug },
            update: {},
            create: {
              name: cleanName,
              slug: subcategorySlug,
            },
            select: { id: true },
          })

          await db.funderSubcategory.create({
            data: {
              funderId: exists.id,
              subcategoryId: subcategory.id,
            },
          }).catch(() => {
            // If it already exists, don't treat as a failure for re-runs.
          })
        }

        console.log(`Updated subcategories for: ${exists.name}`)
        continue
      }

      fundersProcessed++

      const rawHtml = await fetchHtmlText(url, 10_000)

      const faviconUrl = extractFaviconUrl(url, rawHtml)

      const ogTitle =
        rawHtml.match(/<meta[^>]*property="og:title"[^>]*content="([^"]*)"/)?.[1] ?? ""
      const ogDescription =
        rawHtml.match(/<meta[^>]*property="og:description"[^>]*content="([^"]*)"/)?.[1] ??
        ""
      const ogImage =
        rawHtml.match(/<meta[^>]*property="og:image"[^>]*content="([^"]*)"/)?.[1] ?? ""
      const twitterDescription =
        rawHtml.match(
          /<meta[^>]*name="twitter:description"[^>]*content="([^"]*)"/,
        )?.[1] ?? ""
      const metaDescription =
        rawHtml.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"/)?.[1] ?? ""

      const cleanedText = stripHtmlAndClean(rawHtml)

      const { jsonText, usage } = await extractClaudeCompanyData({
        url,
        cleanedText,
        ogTitle,
        ogDescription,
        ogImage,
        twitterDescription,
        metaDescription,
        knownName: funder.funderName,
        knownNameLabel: "funder",
        knownPrimaryCategory: funder.primaryCategory,
      })
      totalApiCalls++
      totalInputTokens += usage.inputTokens
      totalOutputTokens += usage.outputTokens

      let extracted: ExtractedCompanyData
      try {
        extracted = JSON.parse(jsonText) as ExtractedCompanyData
      } catch (e) {
        throw new Error(`Failed to parse Anthropic JSON: ${String(e)}`)
      }

      const sectors = extracted.sectors ?? []
      if (!Array.isArray(sectors)) throw new Error("Extracted sectors was not an array")

      // Always override with favicon-derived logo to avoid large hero images.
      extracted.logoUrl = faviconUrl

      await upsertFunderAndSectors({
        url,
        extracted,
        subcategoryNames: funder.subcategories,
      })

      fundersCreated++
      console.log(`Created draft Funder: ${url}`)
    } catch (e) {
      fundersFailed++
      console.error(`Funder URL failed: ${url}`, e)
    }

    // Rate limiting between API calls
    await delay(2000)
  }

  return {
    fundersProcessed,
    fundersCreated,
    fundersSkipped,
    fundersFailed,
    totalApiCalls,
    totalInputTokens,
    totalOutputTokens,
  }
}

async function main() {
  const companiesCsvPath = path.join(process.cwd(), "companies.csv")
  const fundersCsvPath = path.join(process.cwd(), "funders.csv")

  if (!fs.existsSync(companiesCsvPath)) {
    throw new Error(`Missing companies.csv at ${companiesCsvPath}`)
  }

  const companiesRaw = fs.readFileSync(companiesCsvPath, "utf8")

  const companyUrls = parseCompaniesCsv(companiesRaw)
  const funderUrls: FunderCsvRow[] = fs.existsSync(fundersCsvPath)
    ? parseCompaniesCsv(fs.readFileSync(fundersCsvPath, "utf8")).map(row => ({
        url: row.url,
        funderName: row.companyName,
        primaryCategory: row.primaryCategory,
        subcategories: row.subcategories,
      }))
    : []

  console.log(`Companies URLs: ${companyUrls.length}`)
  console.log(`Funders URLs: ${funderUrls.length}`)

  const companyResult = await processUrlsAsCompanies(companyUrls)
  const funderResult = funderUrls.length
    ? await processUrlsAsFunders(funderUrls)
    : {
        fundersProcessed: 0,
        fundersCreated: 0,
        fundersSkipped: 0,
        fundersFailed: 0,
        totalApiCalls: 0,
        totalInputTokens: 0,
        totalOutputTokens: 0,
      }

  const totalApiCalls = companyResult.totalApiCalls + funderResult.totalApiCalls
  const totalInputTokens =
    companyResult.totalInputTokens + funderResult.totalInputTokens
  const totalOutputTokens =
    companyResult.totalOutputTokens + funderResult.totalOutputTokens

  const estimatedCost =
    totalInputTokens * 0.000003 + totalOutputTokens * 0.000015

  console.log("\n--- Summary ---")
  console.log("Companies processed:", companyResult.companiesProcessed)
  console.log("Companies created:", companyResult.companiesCreated)
  console.log("Companies skipped (already exist):", companyResult.companiesSkipped)
  console.log("Companies failed:", companyResult.companiesFailed)

  console.log("Funders processed:", funderResult.fundersProcessed)
  console.log("Funders created:", funderResult.fundersCreated)
  console.log("Funders skipped (already exist):", funderResult.fundersSkipped)
  console.log("Funders failed:", funderResult.fundersFailed)

  console.log("Total API calls made:", totalApiCalls)
  console.log("Estimated cost:", estimatedCost)
  console.log("Total input tokens:", totalInputTokens)
  console.log("Total output tokens:", totalOutputTokens)
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})

