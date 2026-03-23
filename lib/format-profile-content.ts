/** Escape text for safe insertion into HTML (with dangerouslySetInnerHTML). */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function paragraphHtml(body: string): string {
  const escaped = escapeHtml(body.trim())
  const withBreaks = escaped.replace(/\n/g, "<br />")
  return `<p>${withBreaks}</p>`
}

/**
 * Turn plain profile copy into simple HTML paragraphs for readable display.
 */
export function formatProfileContent(text: string | null | undefined): string {
  if (text == null || text === "") return ""

  const trimmed = text.trim()
  if (!trimmed) return ""

  // Step 1: If text already has \n\n split into paragraphs
  if (trimmed.includes("\n\n")) {
    return trimmed
      .split("\n\n")
      .filter(p => p.trim().length > 0)
      .map(p => paragraphHtml(p))
      .join("")
  }

  // Step 2: For single block text, try to split into logical paragraphs
  // Split after every 2-3 sentences (roughly 300-400 chars)
  const sentences = trimmed.match(/[^.!?]+[.!?]+/g) || [trimmed]
  const paragraphs: string[] = []
  let current = ""

  for (const sentence of sentences) {
    current += sentence
    if (current.length > 300) {
      paragraphs.push(current.trim())
      current = ""
    }
  }
  if (current.trim()) paragraphs.push(current.trim())

  return paragraphs
    .filter(p => p.length > 0)
    .map(p => paragraphHtml(p))
    .join("")
}
