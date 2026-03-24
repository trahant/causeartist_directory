"use client"

import { usePathname } from "next/navigation"
import type { ComponentProps, ReactNode } from "react"
import { Badge } from "~/components/common/badge"
import { Button, type ButtonProps } from "~/components/common/button"
import { Link } from "~/components/common/link"
import { Separator } from "~/components/common/separator"
import { Stack } from "~/components/common/stack"
import { Tooltip } from "~/components/common/tooltip"
import { cx } from "~/lib/utils"

type NavLink = ButtonProps & {
  title: string
  href: string
  label?: ReactNode
}

export type NavSection = { type: "section"; title: string }

export type NavEntry = NavLink | NavSection | undefined

type NavProps = ComponentProps<"nav"> & {
  isCollapsed: boolean
  links: NavEntry[]
}

export const Nav = ({ className, links, isCollapsed, ...props }: NavProps) => {
  const pathname = usePathname()
  const rootPath = "/admin"

  const isActive = (href: string) => {
    if (
      (href === rootPath && href === pathname) ||
      (href !== rootPath && pathname.startsWith(href))
    ) {
      return true
    }

    return false
  }

  return (
    <nav
      className={cx(
        "flex flex-col gap-1 p-3 group-data-[collapsed=true]/collapsible:justify-center group-data-[collapsed=true]/collapsible:px-2",
        className,
      )}
      {...props}
    >
      {links.map((link, index) => {
        if (!link) {
          return <Separator key={index} className="my-2 -mx-3 w-auto" />
        }

        if ("type" in link && link.type === "section") {
          if (isCollapsed) {
            return <Separator key={index} className="my-1 -mx-3 w-auto opacity-50" />
          }
          return (
            <p
              key={index}
              className="px-3 pt-2 pb-0 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
            >
              {link.title}
            </p>
          )
        }

        const { href, title, label, suffix, ...props } = link

        if (isCollapsed) {
          return (
            <Tooltip
              key={index}
              side="right"
              tooltip={
                <Stack size="lg">
                  {title}
                  {label && <span className="opacity-60">{label}</span>}
                </Stack>
              }
            >
              <Button
                size="md"
                variant="ghost"
                aria-label={title}
                className={cx("font-sans", isActive(href) && "bg-accent text-foreground")}
                asChild
                {...props}
              >
                <Link href={href} />
              </Button>
            </Tooltip>
          )
        }

        return (
          <Button
            key={index}
            size="md"
            variant="ghost"
            suffix={
              suffix ||
              (label && (
                <Badge variant="outline" className="ml-auto size-auto">
                  {label}
                </Badge>
              ))
            }
            className={cx("justify-start font-sans", isActive(href) && "bg-accent text-foreground")}
            asChild
            {...props}
          >
            <Link href={href}>{title}</Link>
          </Button>
        )
      })}
    </nav>
  )
}
