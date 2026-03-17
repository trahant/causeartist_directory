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

export const processContent = (html: string) => addHeadingIdsToHtml(html)

