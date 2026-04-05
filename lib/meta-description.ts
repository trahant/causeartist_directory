import { siteConfig } from "~/config/site"

const MIN = 120
const MAX = 160

/**
 * Normalizes meta descriptions for SEO (target ~120–160 characters).
 */
export function normalizeMetaDescription(text: string, fallbackTitle: string): string {
  let t = text.trim().replace(/\s+/g, " ")
  if (!t) {
    t =
      fallbackTitle.trim() ||
      `Discover impact companies and investors on ${siteConfig.name}.`
  }
  if (t.length > MAX) {
    let cut = t.slice(0, MAX - 1)
    const lastSpace = cut.lastIndexOf(" ")
    if (lastSpace > MAX * 0.55) cut = cut.slice(0, lastSpace)
    return `${cut.trimEnd()}…`
  }
  if (t.length < MIN) {
    if (!t.includes(siteConfig.name)) {
      t = `${t} — ${siteConfig.name}`
    }
    if (t.length < MIN) {
      t = `${t} Trusted directory for impact investing and social enterprise.`
    }
    if (t.length > MAX) {
      let cut = t.slice(0, MAX - 1)
      const lastSpace = cut.lastIndexOf(" ")
      if (lastSpace > MIN) cut = cut.slice(0, lastSpace)
      return `${cut.trimEnd()}…`
    }
  }
  return t.slice(0, MAX)
}
