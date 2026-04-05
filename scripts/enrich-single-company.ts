#!/usr/bin/env bun
/**
 * Enrich a single company by URL or name from the command line.
 *
 * bun scripts/enrich-single-company.ts --url "https://zya.co"
 * bun scripts/enrich-single-company.ts --name "Zya"
 * bun scripts/enrich-single-company.ts --url "https://zya.co" --publish
 */
import { generateUniqueSlug } from "~/lib/slugs"
import { db } from "~/services/db"

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages"
const MODEL = "claude-sonnet-4-20250514"
const PAGE_TEXT_MAX = 2000
const COMBINED_TEXT_MAX = 6000
const FETCH_TIMEOUT_MS = 12_000

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

const ALLOWED_SECTORS = [
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

const allowedSectorSet = new Set<string>(ALLOWED_SECTORS)

function printUsage() {
  console.log(`Usage:
  bun scripts/enrich-single-company.ts --url "https://example.com"
  bun scripts/enrich-single-company.ts --name "Company Name"
  bun scripts/enrich-single-company.ts --url "https://example.com" --publish`)
}

function parseArgs() {
  const args = process.argv.slice(2)
  let url: string | undefined
  let name: string | undefined
  let publish = false

  for (let i = 0; i < args.length; i++) {
    const a = args[i]
    if (a === "--url" && args[i + 1]) {
      url = args[++i]
      continue
    }
    if (a === "--name" && args[i + 1]) {
      name = args[++i]
      continue
    }
    if (a === "--publish") {
      publish = true
      continue
    }
  }

  return { url, name, publish }
}

function normalizeWebsiteUrl(raw: string): string {
  const trimmed = raw.trim()
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
  const u = new URL(withProtocol)
  return `${u.protocol}//${u.hostname}`
}

function extractHostnameForMatch(raw: string): string {
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
  const u = new URL(withProtocol)
  return u.hostname.replace(/^www\./i, "").toLowerCase()
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
      new RegExp(`${attr}\\s*=\\s*["']([^"']+)["']`, "i").exec(tag)?.[1]?.trim() ?? ""
    )
  }

  const getHref = (tag: string) => parseAttr(tag, "href")
  const getRel = (tag: string) => parseAttr(tag, "rel").toLowerCase()
  const getSizes = (tag: string) => parseAttr(tag, "sizes")

  const toAbsolute = (faviconUrl: string) => {
    if (!faviconUrl) return ""
    try {
      return new URL(faviconUrl, pageUrl).href
    } catch {
      return faviconUrl
    }
  }

  const hasRelToken = (rel: string, token: string) => rel.split(/\s+/).includes(token)

  for (const tag of links) {
    const rel = getRel(tag)
    if (!rel) continue
    if (hasRelToken(rel, "apple-touch-icon")) {
      const href = getHref(tag)
      if (href) return toAbsolute(href)
    }
  }

  for (const tag of links) {
    const rel = getRel(tag)
    if (!rel) continue
    if (!hasRelToken(rel, "icon")) continue

    const sizes = getSizes(tag)
    if (sizes !== "192x192" && sizes !== "180x180") continue

    const href = getHref(tag)
    if (href) return toAbsolute(href)
  }

  for (const tag of links) {
    const rel = getRel(tag)
    if (!rel) continue
    const shortcutIcon = rel.includes("shortcut") && rel.includes("icon")
    if (!shortcutIcon) continue

    const href = getHref(tag)
    if (href) return toAbsolute(href)
  }

  for (const tag of links) {
    const rel = getRel(tag)
    if (!rel) continue
    if (!hasRelToken(rel, "icon")) continue

    const href = getHref(tag)
    if (href) return toAbsolute(href)
  }

  return googleFallback
}

async function fetchPageHtml(url: string): Promise<string> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    const res = await fetch(url, { signal: controller.signal })
    if (!res.ok) return ""
    return await res.text()
  } catch {
    return ""
  } finally {
    clearTimeout(timeout)
  }
}

function pageTextFromHtml(html: string): string {
  if (!html) return ""
  const cleaned = collapseWhitespace(stripHtmlToText(html))
  if (cleaned.length <= PAGE_TEXT_MAX) return cleaned
  return cleaned.slice(0, PAGE_TEXT_MAX)
}

function resolveRegion(countryCode: string): string {
  const mapped = COUNTRY_TO_REGION[countryCode.toUpperCase()]
  if (mapped && (VALID_REGIONS as readonly string[]).includes(mapped)) {
    return mapped
  }
  return "north-america"
}

function countrySlug(country: string): string {
  const s = country
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
  return s || "unknown"
}

async function getOrCreateLocation(
  country: string,
  countryCode: string,
  region: string,
): Promise<{ id: string }> {
  const slug = countrySlug(country)
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
  return { id: loc.id }
}

function nullIfEmpty(s: string | null | undefined): string | null {
  if (s == null) return null
  const t = String(s).trim()
  if (!t || t.toLowerCase() === "null") return null
  return t
}

type ClaudeExtract = {
  name: string
  tagline: string
  description: string
  impactModel: string
  impactMetrics: string | null
  founderName: string | null
  foundedYear: number | null
  logoUrl: string | null
  linkedin: string | null
  twitter: string | null
  sectors: string[]
  location: {
    country: string | null
    countryCode: string | null
    city: string | null
  }
}

function parseJsonFromClaude(text: string): ClaudeExtract {
  let raw = text.trim()
  if (raw.startsWith("```")) {
    raw = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "")
  }
  const obj = JSON.parse(raw) as Record<string, unknown>

  const locationRaw = obj.location
  const location =
    locationRaw && typeof locationRaw === "object" && !Array.isArray(locationRaw)
      ? (locationRaw as Record<string, unknown>)
      : {}

  const sectorsRaw = obj.sectors
  const sectors = Array.isArray(sectorsRaw)
    ? sectorsRaw.filter((s): s is string => typeof s === "string")
    : []

  const fy = obj.foundedYear
  let foundedYear: number | null = null
  if (typeof fy === "number" && Number.isFinite(fy)) foundedYear = Math.round(fy)
  else if (typeof fy === "string" && /^\d+$/.test(fy.trim())) foundedYear = parseInt(fy.trim(), 10)

  return {
    name: typeof obj.name === "string" ? obj.name : "",
    tagline: typeof obj.tagline === "string" ? obj.tagline : "",
    description: typeof obj.description === "string" ? obj.description : "",
    impactModel: typeof obj.impactModel === "string" ? obj.impactModel : "",
    impactMetrics: nullIfEmpty(obj.impactMetrics as string | null),
    founderName: nullIfEmpty(obj.founderName as string | null),
    foundedYear,
    logoUrl: nullIfEmpty(obj.logoUrl as string | null),
    linkedin: nullIfEmpty(obj.linkedin as string | null),
    twitter: nullIfEmpty(obj.twitter as string | null),
    sectors: sectors.filter(s => allowedSectorSet.has(s)),
    location: {
      country: nullIfEmpty(location.country as string | null),
      countryCode: nullIfEmpty(location.countryCode as string | null)?.toUpperCase() ?? null,
      city: nullIfEmpty(location.city as string | null),
    },
  }
}

async function callClaudeExtract(args: {
  website: string
  ogTitle: string
  ogDescription: string
  ogImage: string
  metaDescription: string
  combinedText: string
}): Promise<{ extracted: ClaudeExtract; inputTokens: number; outputTokens: number }> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error("Missing ANTHROPIC_API_KEY")

  const content = `Extract comprehensive information about this company.

Company website: ${args.website}

Meta data:
og:title: ${args.ogTitle}
og:description: ${args.ogDescription}
og:image: ${args.ogImage}
meta:description: ${args.metaDescription}

Website content:
${args.combinedText}

Return ONLY a JSON object with no markdown:
{
  "name": "Official company name",
  "tagline": "One compelling sentence max 15 words describing what they do and their positive impact",
  "description": "Write 3 paragraphs separated by \\n\\n. Paragraph 1: What they do and their products/services. Paragraph 2: Their mission and why they exist. Paragraph 3: Their impact on the world. Minimum 150 words total.",
  "impactModel": "1-2 paragraphs explaining how their business model creates social or environmental impact. Separate paragraphs with \\n\\n.",
  "impactMetrics": "Specific measurable impact claims if any, or null",
  "founderName": "Founder name(s) or null",
  "foundedYear": number or null,
  "logoUrl": "Use og:image if available, otherwise null",
  "linkedin": "LinkedIn company URL or null",
  "twitter": "Twitter/X URL or null",
  "sectors": ["1-3 sector slugs from this list only: climate-tech, clean-energy, environment, circular-economy, sustainable-food, health, education, impact-finance, community-development, responsible-fashion, clean-transportation, built-environment"],
  "location": {
    "country": "Full country name or null",
    "countryCode": "ISO 2-letter code or null",
    "city": "City name or null"
  }
}`

  const response = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 2000,
      messages: [{ role: "user", content }],
    }),
  })

  const data: unknown = await response.json().catch(() => null)
  const parsed = data as {
    content?: Array<{ type?: string; text?: string }>
    usage?: { input_tokens?: number; output_tokens?: number }
  } | null

  const inputTokens = parsed?.usage?.input_tokens ?? 0
  const outputTokens = parsed?.usage?.output_tokens ?? 0

  if (!response.ok) {
    throw new Error(
      `Anthropic API error ${response.status}: ${JSON.stringify(
        typeof data === "object" && data && "error" in data
          ? (data as { error?: unknown }).error
          : data,
      )}`,
    )
  }

  const block = parsed?.content?.find(c => c.type === "text" && c.text)
  const jsonText = block?.text
  if (!jsonText || typeof jsonText !== "string") {
    throw new Error("Anthropic response missing text content block")
  }

  const extracted = parseJsonFromClaude(jsonText)
  if (!extracted.name.trim()) {
    throw new Error("Claude returned empty company name")
  }

  return { extracted, inputTokens, outputTokens }
}

function resolveFinalLogoUrl(
  claudeLogo: string | null,
  ogImage: string,
  favicon: string,
): string | null {
  const og = ogImage.trim()
  const fav = favicon.trim()
  if (claudeLogo == null || claudeLogo === "") {
    return fav || null
  }
  return og || fav || null
}

function sectorDisplayName(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map(part => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(" ")
}

async function main() {
  const { url: inputUrl, name: inputName, publish } = parseArgs()

  if (!inputUrl && !inputName) {
    printUsage()
    process.exit(1)
  }

  const anthropicKey = process.env.ANTHROPIC_API_KEY
  if (!anthropicKey) {
    throw new Error("Missing required env var ANTHROPIC_API_KEY")
  }

  let company = null as Awaited<ReturnType<typeof db.company.findFirst>>
  let fetchBaseUrl: string | null = null

  if (inputUrl) {
    fetchBaseUrl = normalizeWebsiteUrl(inputUrl)
    const domain = extractHostnameForMatch(inputUrl)
    company = await db.company.findFirst({
      where: {
        website: { contains: domain, mode: "insensitive" },
      },
    })
  } else if (inputName) {
    company = await db.company.findFirst({
      where: { name: { contains: inputName, mode: "insensitive" } },
    })
    if (company?.website?.trim()) {
      fetchBaseUrl = normalizeWebsiteUrl(company.website)
    }
  }

  if (!company) {
    console.log("Company not found. Creating new draft...")
    if (!inputUrl) {
      throw new Error(
        "Cannot create a company without --url. Pass --url with the company website to create a draft.",
      )
    }
    fetchBaseUrl = normalizeWebsiteUrl(inputUrl)
    const domain = extractHostnameForMatch(inputUrl)
    const placeholderName = domain
    const slug = await generateUniqueSlug(domain, async s => {
      const hit = await db.company.findFirst({ where: { slug: s }, select: { id: true } })
      return Boolean(hit)
    })

    company = await db.company.create({
      data: {
        name: placeholderName,
        slug,
        status: "draft",
        website: fetchBaseUrl,
      },
    })
  }

  if (!fetchBaseUrl?.trim()) {
    throw new Error(
      "Company has no website URL; cannot fetch pages. Set website on the record or use --url.",
    )
  }

  const base = fetchBaseUrl.replace(/\/+$/, "")
  const urlsToFetch = [
    fetchBaseUrl,
    `${base}/about`,
    `${base}/about-us`,
    `${base}/mission`,
    `${base}/impact`,
    `${base}/sustainability`,
  ]

  const settled = await Promise.allSettled(urlsToFetch.map(u => fetchPageHtml(u)))

  let homeHtml = ""
  const pageChunks: string[] = []

  for (let i = 0; i < settled.length; i++) {
    const r = settled[i]
    const html = r.status === "fulfilled" ? r.value : ""
    if (i === 0) homeHtml = html
    const text = pageTextFromHtml(html)
    if (text) pageChunks.push(text)
  }

  const ogTitle = extractMetaContent(homeHtml, "property", "og:title")
  const ogDescription = extractMetaContent(homeHtml, "property", "og:description")
  const ogImage = extractMetaContent(homeHtml, "property", "og:image")
  const metaDescription = extractMetaContent(homeHtml, "name", "description")

  let combinedText = pageChunks.join("\n\n")
  if (combinedText.length > COMBINED_TEXT_MAX) {
    combinedText = combinedText.slice(0, COMBINED_TEXT_MAX)
  }

  const homepageUrl = urlsToFetch[0] ?? fetchBaseUrl
  const faviconUrl = homeHtml ? extractFaviconUrl(homepageUrl, homeHtml) : ""

  const { extracted, inputTokens, outputTokens } = await callClaudeExtract({
    website: fetchBaseUrl,
    ogTitle,
    ogDescription,
    ogImage,
    metaDescription,
    combinedText,
  })

  const logoUrl = resolveFinalLogoUrl(extracted.logoUrl, ogImage, faviconUrl)

  await db.company.update({
    where: { id: company.id },
    data: {
      name: extracted.name,
      tagline: nullIfEmpty(extracted.tagline) ?? null,
      description: nullIfEmpty(extracted.description) ?? null,
      impactModel: nullIfEmpty(extracted.impactModel) ?? null,
      impactMetrics: extracted.impactMetrics,
      founderName: extracted.founderName,
      foundedYear: extracted.foundedYear,
      linkedin: extracted.linkedin,
      twitter: extracted.twitter,
      logoUrl,
      ...(publish ? { status: "published" } : {}),
    },
  })

  await db.companySector.deleteMany({ where: { companyId: company.id } })

  const sectorNamesForPrint: string[] = []
  const uniqueSectorSlugs = Array.from(new Set(extracted.sectors))
  for (const sectorSlug of uniqueSectorSlugs) {
    const sector = await db.sector.upsert({
      where: { slug: sectorSlug },
      update: {},
      create: {
        name: sectorDisplayName(sectorSlug),
        slug: sectorSlug,
      },
      select: { id: true, name: true },
    })
    sectorNamesForPrint.push(sector.name)
    await db.companySector.create({
      data: { companyId: company.id, sectorId: sector.id },
    })
  }

  await db.companyLocation.deleteMany({ where: { companyId: company.id } })

  let locationLabel = "—"
  const loc = extracted.location
  const cc = loc.countryCode?.trim()
  if (cc && cc.length === 2 && loc.country) {
    const region = resolveRegion(cc)
    const { id: locationId } = await getOrCreateLocation(loc.country, cc, region)
    await db.companyLocation.create({
      data: { companyId: company.id, locationId },
    })
    const cityPart = loc.city ? `${loc.city}, ` : ""
    locationLabel = `${cityPart}${loc.country}`
  }

  const cost = inputTokens * INPUT_TOKEN_PRICE + outputTokens * OUTPUT_TOKEN_PRICE

  const desc = extracted.description ?? ""
  const descPreview = desc.length <= 100 ? desc : `${desc.slice(0, 100)}...`

  const finalCompany = await db.company.findUniqueOrThrow({
    where: { id: company.id },
    select: { status: true },
  })

  console.log(`✓ Name: ${extracted.name}`)
  console.log(`✓ Tagline: ${extracted.tagline}`)
  console.log(`✓ Description: ${descPreview}`)
  console.log(`✓ Logo: ${logoUrl ?? "—"}`)
  console.log(`✓ Sectors: ${sectorNamesForPrint.length ? sectorNamesForPrint.join(", ") : "—"}`)
  console.log(`✓ Location: ${locationLabel}`)
  console.log(`✓ Founded: ${extracted.foundedYear ?? "—"}`)
  console.log(`✓ Founder: ${extracted.founderName ?? "—"}`)
  console.log(`✓ Status: ${finalCompany.status}`)
  console.log("")
  console.log(`API cost: $${cost.toFixed(2)}`)
}

try {
  await main()
} catch (e) {
  const msg = e instanceof Error ? e.message : String(e)
  console.error(`Error: ${msg}`)
  process.exit(1)
}
