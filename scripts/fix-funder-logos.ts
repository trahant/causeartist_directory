#!/usr/bin/env node
import { db } from "~/services/db"

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function fetchHtmlText(url: string, timeoutMs = 10_000) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(url, { signal: controller.signal })
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`)
    return await res.text()
  } finally {
    clearTimeout(timeout)
  }
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

async function main() {
  const largeImageSubstrings = [
    "og:image",
    "/images/",
    "/img/",
    "/assets/",
    "/uploads/",
    "/wp-content/",
    "/hero",
    "/og/",
    "/banner",
  ]

  const candidates = await db.funder.findMany({
    where: {
      OR: largeImageSubstrings.map(s => ({
        logoUrl: { contains: s },
      })),
    },
    select: { id: true, website: true, logoUrl: true },
  })

  let updated = 0
  let skipped = 0
  let failed = 0

  console.log(`Funder logo candidates: ${candidates.length}`)

  for (const [idx, funder] of candidates.entries()) {
    try {
      const website = funder.website
      if (!website) {
        skipped++
        console.log(`[${idx + 1}/${candidates.length}] Skipping (no website): ${funder.id}`)
        continue
      }

      const html = await fetchHtmlText(website, 10_000)
      const faviconUrl = extractFaviconUrl(website, html)

      if (funder.logoUrl === faviconUrl) {
        skipped++
        console.log(`[${idx + 1}/${candidates.length}] Already correct: ${funder.id}`)
        continue
      }

      await db.funder.update({
        where: { id: funder.id },
        data: { logoUrl: faviconUrl },
      })

      updated++
      console.log(`[${idx + 1}/${candidates.length}] Updated: ${funder.id}`)

      await delay(250)
    } catch (e) {
      failed++
      console.error(`[${idx + 1}/${candidates.length}] Failed: ${funder.id}`, e)
    }
  }

  console.log("\n--- Totals ---")
  console.log("Candidates:", candidates.length)
  console.log("Updated:", updated)
  console.log("Skipped:", skipped)
  console.log("Failed:", failed)
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})

