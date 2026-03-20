"use client"

import { formatNumber } from "@primoui/utils"
import { AtSignIcon, RssIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import type { ComponentProps } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/common/dropdown-menu"
import { H5, H6 } from "~/components/common/heading"
import { BrandGitHubIcon } from "~/components/common/icons/brand-github"
import { Note } from "~/components/common/note"
import { Stack } from "~/components/common/stack"
import { Tooltip } from "~/components/common/tooltip"
import { BuiltWith } from "~/components/web/built-with"
import { CTAForm } from "~/components/web/cta-form"
import { ExternalLink } from "~/components/web/external-link"
import { ThemeSwitcher } from "~/components/web/theme-switcher"
import { NavLink, navLinkVariants } from "~/components/web/ui/nav-link"
import { adsConfig } from "~/config/ads"
import { linksConfig } from "~/config/links"
import { siteConfig } from "~/config/site"
import { cx } from "~/lib/utils"

export const Footer = ({ children, className, ...props }: ComponentProps<"div">) => {
  const t = useTranslations()

  return (
    <footer className="flex flex-col gap-y-8 mt-auto pt-fluid-md border-t border-foreground/10">
      <div
        className={cx("grid grid-cols-3 gap-y-8 gap-x-4 md:gap-x-6 md:grid-cols-16", className)}
        {...props}
      >
        <Stack
          direction="column"
          className="flex flex-col items-start gap-4 col-span-full md:col-span-6"
        >
          <Stack size="lg" direction="column" className="min-w-0 max-w-64">
            <H5 as="strong" className="px-0.5">
              {t("components.footer.cta_title")}
            </H5>

            <Note className="-mt-2 px-0.5 first:mt-0">
              {t("components.footer.cta_description", { count: formatNumber(5000, "standard") })}
            </Note>

            <CTAForm />
          </Stack>

          <Stack className="text-lg opacity-75">
            <Tooltip tooltip={t("navigation.toggle_theme")}>
              <ThemeSwitcher />
            </Tooltip>

            <DropdownMenu modal={false}>
              <Tooltip tooltip={t("navigation.rss_feed")}>
                <DropdownMenuTrigger className={navLinkVariants()}>
                  <RssIcon />
                </DropdownMenuTrigger>
              </Tooltip>

              <DropdownMenuContent align="start">
                {linksConfig.feeds.map(({ title, url }) => (
                  <DropdownMenuItem key={url} asChild>
                    <ExternalLink href={url}>{title}</ExternalLink>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Tooltip tooltip={t("navigation.contact_us")}>
              <ExternalLink href={`mailto:${siteConfig.email}`} className={navLinkVariants()}>
                <AtSignIcon />
              </ExternalLink>
            </Tooltip>

            <Tooltip tooltip={t("navigation.source_code")}>
              <ExternalLink href={linksConfig.github} className={navLinkVariants()}>
                <BrandGitHubIcon />
              </ExternalLink>
            </Tooltip>
          </Stack>
        </Stack>

        <Stack direction="column" className="text-sm md:col-span-3 md:col-start-8">
          <H6 as="strong">{t("navigation.browse")}:</H6>

          <NavLink href="/">{t("navigation.directory")}</NavLink>
          <NavLink href="/companies">{t("navigation.companies")}</NavLink>
          <NavLink href="/funders">{t("navigation.funders")}</NavLink>
          <NavLink href="/certifications">{t("navigation.certifications")}</NavLink>
          <NavLink href="/blog">{t("navigation.blog")}</NavLink>
        </Stack>

        <Stack direction="column" className="text-sm md:col-span-3">
          <H6 as="strong">{t("navigation.quick_links")}:</H6>

          <NavLink href="/about">{t("navigation.about")}</NavLink>
          {adsConfig.enabled && <NavLink href="/advertise">{t("navigation.advertise")}</NavLink>}
        </Stack>
      </div>

      <BuiltWith medium="footer" className="self-start" />

      {children}
    </footer>
  )
}
