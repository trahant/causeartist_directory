"use client"

import { useScrollSpy } from "@mantine/hooks"
import { AlignLeftIcon, ChevronDownIcon } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { useTranslations } from "next-intl"
import type { ComponentProps, ReactNode } from "react"
import { useEffect, useMemo, useState } from "react"
import { Stack } from "~/components/common/stack"
import { cx } from "~/lib/utils"

type InlineMenuProps<T extends { id: string }> = ComponentProps<"div"> & {
  items: T[]
  renderItem: (item: T, isActive: boolean, index: number) => ReactNode
  collapsible?: boolean
  showHeader?: boolean
}

export const InlineMenu = <T extends { id: string }>({
  children,
  className,
  items,
  renderItem,
  title,
  collapsible = true,
  showHeader = true,
  ...props
}: InlineMenuProps<T>) => {
  const t = useTranslations("common")
  const [isOpen, setIsOpen] = useState(true)
  const selector = useMemo(() => items.map(({ id }) => `[id="${id}"]`).join(","), [items])
  const { active, data } = useScrollSpy({ selector })
  const activeId = data[active]?.id

  useEffect(() => {
    if (!activeId) return

    const activeMenuElement = document.querySelector(`nav a[href="#${activeId}"]`)
    activeMenuElement?.scrollIntoView({ block: "nearest", inline: "nearest" })
  }, [activeId])

  return (
    <div
      className={cx("flex flex-col gap-3 flex-1 overflow-hidden max-md:hidden lg:px-5", className)}
      {...props}
    >
      {showHeader && (
        <Stack
          size="sm"
          wrap={false}
          className="group text-start w-full text-muted-foreground enabled:hover:text-foreground"
          asChild
        >
          <button type="button" onClick={() => setIsOpen(!isOpen)} disabled={!collapsible}>
            <AlignLeftIcon />
            <span className="flex-1 truncate text-sm">{title || t("on_this_page")}</span>
            {collapsible && (
              <ChevronDownIcon className={cx("duration-200", isOpen && "rotate-180")} />
            )}
          </button>
        </Stack>
      )}

      <AnimatePresence initial={false}>
        {(!collapsible || isOpen) && (
          <motion.nav
            initial={collapsible ? { height: 0 } : false}
            animate={{ height: "auto" }}
            exit={collapsible ? { height: 0 } : undefined}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="flex flex-col overflow-y-auto overscroll-contain scroll-smooth"
          >
            {items.map((item, index) => renderItem(item, activeId === item.id, index))}
            {children}
          </motion.nav>
        )}
      </AnimatePresence>
    </div>
  )
}
