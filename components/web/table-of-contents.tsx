"use client"

import { motion } from "motion/react"
import { type ComponentProps, type ReactNode, useId } from "react"
import { InlineMenu } from "~/components/web/inline-menu"
import { cx } from "~/lib/utils"

type TableOfContentsProps = Omit<ComponentProps<typeof InlineMenu>, "items" | "renderItem"> & {
  headings: { id: string; text: ReactNode; level: number }[]
}

export const TableOfContents = ({ headings, ...props }: TableOfContentsProps) => {
  const id = useId()

  // Find minimum heading level to calculate absolute indentation
  const minLevel = Math.min(...headings.map(h => h.level))

  // Don't render if no headings
  if (!headings?.length) {
    return null
  }

  return (
    <InlineMenu
      items={headings}
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
  )
}
