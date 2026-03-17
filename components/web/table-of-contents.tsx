"use client"

import { motion } from "motion/react"
import { type ComponentProps, type ReactNode, useId } from "react"
import { InlineMenu } from "~/components/web/inline-menu"
import { slugifyHeading } from "~/lib/content"
import { cx } from "~/lib/utils"

type Heading = { id: string; text: ReactNode; level: number }

type TableOfContentsProps = Omit<ComponentProps<typeof InlineMenu>, "items" | "renderItem"> &
  (
    | { content: string; headings?: never }
    | { headings: Heading[]; content?: never }
  )

const stripTags = (html: string) => html.replace(/<[^>]*>/g, "")

const decodeHtmlEntities = (text: string) => {
  return text
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", "\"")
    .replaceAll("&#39;", "'")
    .replaceAll("&nbsp;", " ")
}

const isMainSectionHeading = (text: string) => {
  const t = text.trim()
  if (!t) return false

  // Filter out Q&A-style headings that tend to be nested under a section
  if (/^(q:|q\.)\s*/i.test(t)) return false
  if (t.endsWith("?")) return false

  return true
}

const parseHeadingsFromHtml = (content: string): Heading[] => {
  const used = new Set<string>()
  const headings: Heading[] = []
  // Only include main section headings (h2). Skip subheadings (h3+).
  const re = /<h(2)([^>]*)>([\s\S]*?)<\/h\1>/gi

  let match: RegExpExecArray | null
  while ((match = re.exec(content)) !== null) {
    const level = Number(match[1])
    const attrs = match[2] ?? ""
    const inner = match[3] ?? ""

    const idMatch = /\sid\s*=\s*["']([^"']+)["']/i.exec(attrs)
    const rawText = decodeHtmlEntities(stripTags(inner)).trim()
    if (!isMainSectionHeading(rawText)) continue
    const base = slugifyHeading(rawText)

    let id = (idMatch?.[1] ?? base ?? "").trim()
    if (!id) id = "section"

    if (used.has(id)) {
      let i = 2
      while (used.has(`${id}-${i}`)) i++
      id = `${id}-${i}`
    }
    used.add(id)

    headings.push({ id, text: rawText, level })
  }

  return headings
}

export const TableOfContents = (props: TableOfContentsProps) => {
  const id = useId()

  const items =
    "headings" in props
      ? props.headings!.filter(h => h.level === 2 && isMainSectionHeading(String(h.text)))
      : parseHeadingsFromHtml(props.content)

  // Don't render if too few headings
  if (!items?.length || items.length < 3) {
    return null
  }

  // Find minimum heading level to calculate absolute indentation
  const minLevel = Math.min(...items.map(h => h.level))

  return (
    <nav className="sticky top-24">
      <div className="px-4 pb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Contents
      </div>
      <InlineMenu
        items={items}
        showHeader={false}
        collapsible={false}
        renderItem={(heading, isActive) => {
        const indentLevel = heading.level - minLevel

        return (
          <a
            key={heading.id}
            href={`#${heading.id}`}
            className={cx(
              "relative py-1 text-sm leading-relaxed border-l-2 border-accent",
              // Indentation based on absolute level
              indentLevel === 0 && "pl-4",
              indentLevel === 1 && "pl-8",
              indentLevel === 2 && "pl-10",
              indentLevel >= 3 && "pl-12",
              // Active state
              isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {heading.text}

            {isActive && (
              <motion.div
                className="absolute z-10 -left-0.5 inset-y-0 w-0.5 bg-foreground rounded-full"
                layoutId={`toc-indicator-${id}`}
                transition={{ type: "tween", duration: 0.15, ease: "easeOut" }}
              />
            )}
          </a>
        )
      }}
      {...props}
      />
    </nav>
  )
}
