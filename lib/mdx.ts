import GithubSlugger from "github-slugger"

export type Heading = {
  id: string
  text: string
  level: number
}

/**
 * Strip markdown formatting from text, leaving only plain text.
 * Handles common markdown syntax like bold, italic, links, code, etc.
 */
const stripMarkdown = (text: string): string => {
  return (
    text
      // Remove inline code
      .replace(/`([^`]+)`/g, "$1")
      // Remove bold/italic (**, __, *, _)
      .replace(/(\*\*|__)(.*?)\1/g, "$2")
      .replace(/(\*|_)(.*?)\1/g, "$2")
      // Remove links [text](url) -> text
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      // Remove images ![alt](url) -> alt
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
      // Remove strikethrough ~~text~~
      .replace(/~~(.*?)~~/g, "$1")
      // Remove HTML tags
      .replace(/<[^>]+>/g, "")
      // Clean up extra whitespace
      .replace(/\s+/g, " ")
      .trim()
  )
}

/**
 * Extract headings from raw markdown/MDX content without compiling to HTML.
 * Generates GitHub-compatible slug IDs (same as rehype-slug).
 */
export const extractHeadingsFromMDX = (markdown: string): Heading[] => {
  const slugger = new GithubSlugger()
  const headings: Heading[] = []

  // Remove code blocks first to avoid matching headings inside them
  const withoutCodeBlocks = markdown.replace(/```[\s\S]*?```/g, "")

  // Match markdown headings: ^#{1,6}\s+(.+)$
  const headingRegex = /^(#{1,6})\s+(.+)$/gm

  let match: RegExpExecArray | null
  while (true) {
    match = headingRegex.exec(withoutCodeBlocks)
    if (!match) break

    const level = match[1].length

    // Only include h1-h3 in table of contents
    if (level > 3) continue

    const rawText = match[2].trim()

    // Strip markdown formatting from heading text
    const text = stripMarkdown(rawText)

    // Generate GitHub-compatible slug (matches rehype-slug behavior)
    const id = slugger.slug(text)

    headings.push({ id, text, level })
  }

  return headings
}

/**
 * Extracts tool slugs from MDX content by parsing <ToolEntry> components.
 * Returns tools in the order they appear in the content.
 */
export const extractToolsFromMDX = (content: string): string[] => {
  // Match <ToolEntry tool="slug" or <ToolEntry tool='slug'
  // Handles both single and double quotes, and various whitespace patterns
  // Uses non-greedy matching to stay within a single ToolEntry tag
  const toolEntryRegex = /<ToolEntry[^>]*?tool\s*=\s*["']([^"']+)["']/g

  const tools: string[] = []
  let match: RegExpExecArray | null = toolEntryRegex.exec(content)

  while (match !== null) {
    const toolSlug = match[1]

    // Avoid duplicates while preserving order
    if (!tools.includes(toolSlug)) {
      tools.push(toolSlug)
    }

    match = toolEntryRegex.exec(content)
  }

  return tools
}
