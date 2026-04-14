import { sanitizeHtml } from "~/lib/sanitize"

const FROM_HEADING_LEVELS = new Set(["2", "3"])

const decodeHtmlEntities = (text: string) => {
  return text
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", "\"")
    .replaceAll("&#39;", "'")
    .replaceAll("&nbsp;", " ")
}

const stripTags = (html: string) => {
  return html.replace(/<[^>]*>/g, "")
}

export const slugifyHeading = (text: string) => {
  return text
    .toLowerCase()
    .trim()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
}

const uniqueId = (base: string, used: Set<string>) => {
  let id = base || "section"
  if (!used.has(id)) {
    used.add(id)
    return id
  }

  let i = 2
  while (used.has(`${id}-${i}`)) i++
  const next = `${id}-${i}`
  used.add(next)
  return next
}

/**
 * Adds `id` attributes to all `<h2>` and `<h3>` tags that are missing them.
 * IDs are generated from the heading text.
 */
/**
 * Normalizes Ghost-exported HTML so case studies (and similar) match site typography:
 * strips kg-card comment noise, removes junk leading paragraphs, unwraps mis-nested headings,
 * and demotes a lone leading &lt;h1&gt; (often duplicates the page title) to &lt;h2&gt;.
 */
export const sanitizeGhostRichHtmlForDisplay = (html: string) => {
  let out = html.trimStart()

  out = out.replaceAll(/<!--\s*kg-card-begin:[\s\S]*?-->\s*/gi, "")
  out = out.replaceAll(/\s*<!--\s*kg-card-end:[\s\S]*?-->/gi, "")

  let prev = ""
  while (prev !== out) {
    prev = out
    out = out.replace(/^(?:\s*<p>(?:\s|&nbsp;|&#160;|<br\s*\/?>)*<\/p>\s*)+/i, "")
  }

  out = out.replaceAll(/<p>\s*(<(?:h2|h3)\b[^>]*>[\s\S]*?<\/(?:h2|h3)>)\s*<\/p>/gi, "$1")
  out = out.replace(/^\s*<h1(\b[^>]*)>([\s\S]*?)<\/h1>\s*/i, "<h2$1>$2</h2>\n")

  // Ghost / pasted HTML often ships light-theme inline colors and backgrounds that
  // clash with our theme (e.g. white spans on a light page, or “holes” over body copy).
  const stripStyleFromOpenTags = (tag: string, html: string) => {
    const re = new RegExp(`<${tag}\\b[^>]*>`, "gi")
    return html.replace(re, open =>
      open
        .replaceAll(/\sstyle\s*=\s*"[^"]*"/gi, "")
        .replaceAll(/\sstyle\s*=\s*'[^']*'/gi, ""),
    )
  }
  for (const tag of ["span", "strong", "em", "b", "i", "p", "a"] as const) {
    out = stripStyleFromOpenTags(tag, out)
  }

  return out.trim()
}

export const addHeadingIdsToHtml = (html: string) => {
  const used = new Set<string>()

  return html.replace(/<h([23])([^>]*)>([\s\S]*?)<\/h\1>/gi, (match, lvl, attrs, inner) => {
    const level = String(lvl)
    if (!FROM_HEADING_LEVELS.has(level)) return match

    const hasId = /\sid\s*=\s*["'][^"']+["']/i.test(String(attrs))
    if (hasId) return match

    const text = decodeHtmlEntities(stripTags(String(inner))).trim()
    const base = slugifyHeading(text)
    const id = uniqueId(base, used)

    return `<h${level}${attrs} id="${id}">${inner}</h${level}>`
  })
}

export const processContent = (html: string) =>
  sanitizeHtml(addHeadingIdsToHtml(html))

