"use client"

import { useHotkeys } from "@mantine/hooks"
import { ChevronDownIcon, SearchIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { usePathname } from "next/navigation"
import { type ComponentProps, useEffect, useState } from "react"
import { Button } from "~/components/common/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/common/dropdown-menu"
import { Link } from "~/components/common/link"
import { Stack } from "~/components/common/stack"
import { ThemeSwitcher } from "~/components/web/theme-switcher"
import { Container } from "~/components/web/ui/container"
import { Hamburger } from "~/components/web/ui/hamburger"
import { Logo } from "~/components/web/ui/logo"
import { NavLink, navLinkVariants } from "~/components/web/ui/nav-link"
import { UserMenu } from "~/components/web/user-menu"
import { useSearch } from "~/contexts/search-context"
import { cx } from "~/lib/utils"

const explorePaths = ["/about", "/case-studies", "/sectors", "/focus"] as const

const Header = ({ className, ...props }: ComponentProps<"div">) => {
  const pathname = usePathname()
  const search = useSearch()
  const t = useTranslations()
  const [isNavOpen, setNavOpen] = useState(false)

  useHotkeys([["Escape", () => setNavOpen(false)]])

  useEffect(() => setNavOpen(false), [pathname])

  const exploreOpen = explorePaths.some(p => pathname === p || pathname.startsWith(`${p}/`))
  const podcastNavOpen = pathname === "/podcast" || pathname.startsWith("/podcast/")

  return (
    <header
      className={cx("fixed top-(--header-top) inset-x-0 z-50 bg-background", className)}
      data-state={isNavOpen ? "open" : "close"}
      {...props}
    >
      <Container>
        <div className="flex items-center py-3.5 gap-4 text-sm h-(--header-height) md:gap-6 lg:gap-8">
          <Stack size="sm" wrap={false} className="min-w-0">
            <button
              type="button"
              onClick={() => setNavOpen(!isNavOpen)}
              className="block -m-1 -ml-1.5 lg:hidden"
            >
              <Hamburger className="size-7" />
            </button>

            <Logo className="min-w-0" />
          </Stack>

          <nav className="flex flex-wrap gap-x-4 gap-y-0.5 flex-1 max-lg:hidden items-center">
            <NavLink href="/companies">{t("navigation.companies")}</NavLink>
            <NavLink href="/funders">{t("navigation.funders")}</NavLink>
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className={cx(
                    navLinkVariants({ isActive: podcastNavOpen, isPadded: true }),
                    "gap-1 cursor-pointer border-0 bg-transparent font-inherit",
                  )}
                >
                  {t("navigation.podcasts")}
                  <ChevronDownIcon className="size-4 shrink-0 opacity-75" aria-hidden />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem asChild>
                  <Link href="/podcast">{t("navigation.podcast_all")}</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/podcast/disruptors-for-good">
                    {t("navigation.podcast_disruptors_for_good")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/podcast/investing-in-impact">
                    {t("navigation.podcast_investing_in_impact")}
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className={cx(
                    navLinkVariants({ isActive: exploreOpen, isPadded: true }),
                    "gap-1 cursor-pointer border-0 bg-transparent font-inherit",
                  )}
                >
                  {t("navigation.explore")}
                  <ChevronDownIcon className="size-4 shrink-0 opacity-75" aria-hidden />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem asChild>
                  <Link href="/about">{t("navigation.about")}</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/case-studies">{t("navigation.case_studies")}</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/sectors">{t("navigation.sectors")}</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/focus">{t("navigation.focus_areas")}</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          <Stack size="sm" wrap={false} className="justify-end max-lg:grow">
            <Button size="sm" variant="ghost" className="p-1 text-base" onClick={search.open}>
              <SearchIcon />
            </Button>

            <Button size="sm" variant="ghost" className="p-1 -ml-1 text-base max-sm:hidden" asChild>
              <ThemeSwitcher />
            </Button>

            <UserMenu />
          </Stack>
        </div>

        <nav
          className={cx(
            "absolute top-full inset-x-0 h-[calc(100dvh-var(--header-top)-var(--header-height))] -mt-px py-4 px-6 grid grid-cols-2 place-items-start place-content-start gap-x-4 gap-y-6 bg-background/90 backdrop-blur-lg transition-opacity lg:hidden overflow-y-auto",
            isNavOpen ? "opacity-100" : "opacity-0 pointer-events-none",
          )}
        >
          <NavLink href="/companies">{t("navigation.companies")}</NavLink>
          <NavLink href="/funders">{t("navigation.funders")}</NavLink>
          <div className="col-span-2 flex flex-col gap-3 w-full pt-2 border-t border-border/40">
            <span className="text-xs font-medium text-muted-foreground">{t("navigation.podcasts")}</span>
            <div className="grid grid-cols-2 gap-x-4 gap-y-4 w-full">
              <NavLink href="/podcast">{t("navigation.podcast_all")}</NavLink>
              <NavLink href="/podcast/disruptors-for-good">
                {t("navigation.podcast_disruptors_for_good")}
              </NavLink>
              <NavLink href="/podcast/investing-in-impact">
                {t("navigation.podcast_investing_in_impact")}
              </NavLink>
            </div>
          </div>
          <div className="col-span-2 flex flex-col gap-3 w-full pt-2 border-t border-border/40">
            <span className="text-xs font-medium text-muted-foreground">{t("navigation.explore")}</span>
            <div className="grid grid-cols-2 gap-x-4 gap-y-4 w-full">
              <NavLink href="/about">{t("navigation.about")}</NavLink>
              <NavLink href="/case-studies">{t("navigation.case_studies")}</NavLink>
              <NavLink href="/sectors">{t("navigation.sectors")}</NavLink>
              <NavLink href="/focus">{t("navigation.focus_areas")}</NavLink>
            </div>
          </div>
        </nav>
      </Container>
    </header>
  )
}

export { Header }
