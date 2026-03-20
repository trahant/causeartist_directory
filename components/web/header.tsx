"use client"

import { useHotkeys } from "@mantine/hooks"
import { SearchIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { usePathname } from "next/navigation"
import { type ComponentProps, useEffect, useState } from "react"
import { Button } from "~/components/common/button"
import { Stack } from "~/components/common/stack"
import { ThemeSwitcher } from "~/components/web/theme-switcher"
import { Container } from "~/components/web/ui/container"
import { Hamburger } from "~/components/web/ui/hamburger"
import { Logo } from "~/components/web/ui/logo"
import { NavLink } from "~/components/web/ui/nav-link"
import { UserMenu } from "~/components/web/user-menu"
import { adsConfig } from "~/config/ads"
import { useSearch } from "~/contexts/search-context"
import { cx } from "~/lib/utils"

const Header = ({ className, ...props }: ComponentProps<"div">) => {
  const pathname = usePathname()
  const search = useSearch()
  const t = useTranslations()
  const [isNavOpen, setNavOpen] = useState(false)

  useHotkeys([["Escape", () => setNavOpen(false)]])

  useEffect(() => setNavOpen(false), [pathname])

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

          <nav className="flex flex-wrap gap-x-4 gap-y-0.5 flex-1 max-lg:hidden">
            <NavLink href="/">{t("navigation.directory")}</NavLink>
            <NavLink href="/companies">{t("navigation.companies")}</NavLink>
            <NavLink href="/funders">{t("navigation.funders")}</NavLink>
            <NavLink href="/certifications">{t("navigation.certifications")}</NavLink>
            <NavLink href="/about">{t("navigation.about")}</NavLink>
            {adsConfig.enabled && <NavLink href="/advertise">{t("navigation.advertise")}</NavLink>}
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
            "absolute top-full inset-x-0 h-[calc(100dvh-var(--header-top)-var(--header-height))] -mt-px py-4 px-6 grid grid-cols-2 place-items-start place-content-start gap-x-4 gap-y-6 bg-background/90 backdrop-blur-lg transition-opacity lg:hidden",
            isNavOpen ? "opacity-100" : "opacity-0 pointer-events-none",
          )}
        >
          <NavLink href="/">{t("navigation.directory")}</NavLink>
          <NavLink href="/companies">{t("navigation.companies")}</NavLink>
          <NavLink href="/funders">{t("navigation.funders")}</NavLink>
          <NavLink href="/certifications">{t("navigation.certifications")}</NavLink>
          <NavLink href="/about">{t("navigation.about")}</NavLink>
          {adsConfig.enabled && <NavLink href="/advertise">{t("navigation.advertise")}</NavLink>}
        </nav>
      </Container>
    </header>
  )
}

export { Header }
