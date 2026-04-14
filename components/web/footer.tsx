"use client"

import Image from "next/image"
import { useTranslations } from "next-intl"
import type { ComponentProps } from "react"
import { Link } from "~/components/common/link"
import { H5, H6 } from "~/components/common/heading"
import { BrandFacebookIcon } from "~/components/common/icons/brand-facebook"
import { BrandInstagramIcon } from "~/components/common/icons/brand-instagram"
import { BrandLinkedInIcon } from "~/components/common/icons/brand-linkedin"
import { BrandXIcon } from "~/components/common/icons/brand-x"
import { Note } from "~/components/common/note"
import { Stack } from "~/components/common/stack"
import { Tooltip } from "~/components/common/tooltip"
import { CTAForm } from "~/components/web/cta-form"
import { ExternalLink } from "~/components/web/external-link"
import { FooterAskAI } from "~/components/web/footer-ask-ai"
import { ThemeSwitcher } from "~/components/web/theme-switcher"
import { NavLink, navLinkVariants } from "~/components/web/ui/nav-link"
import { adsConfig } from "~/config/ads"
import { linksConfig } from "~/config/links"
import { cx } from "~/lib/utils"

export const Footer = ({ children, className, ...props }: ComponentProps<"div">) => {
  const t = useTranslations()

  return (
    <footer className="mt-auto flex flex-col gap-y-8 border-t border-foreground/10 pt-fluid-md">
      <div
        className={cx(
          "grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 xl:grid-cols-12",
          className,
        )}
        {...props}
      >
        <Stack
          direction="column"
          className="col-span-full flex flex-col items-start gap-4 sm:col-span-2 xl:col-span-5"
        >
          <Stack size="lg" direction="column" className="min-w-0 max-w-64">
            <H5 as="strong" className="px-0.5">
              {t("components.footer.cta_title")}
            </H5>

            <Note className="-mt-2 px-0.5 first:mt-0">
              {t("components.footer.cta_description")}
            </Note>

            <CTAForm />
          </Stack>

          <Stack className="text-lg opacity-75">
            <Tooltip tooltip={t("navigation.toggle_theme")}>
              <ThemeSwitcher />
            </Tooltip>

            <Tooltip tooltip={t("navigation.social_facebook")}>
              <ExternalLink
                href={linksConfig.social.facebook}
                className={navLinkVariants()}
                aria-label={t("navigation.social_facebook")}
              >
                <BrandFacebookIcon />
              </ExternalLink>
            </Tooltip>

            <Tooltip tooltip={t("navigation.social_x")}>
              <ExternalLink
                href={linksConfig.social.x}
                className={navLinkVariants()}
                aria-label={t("navigation.social_x")}
              >
                <BrandXIcon />
              </ExternalLink>
            </Tooltip>

            <Tooltip tooltip={t("navigation.social_instagram")}>
              <ExternalLink
                href={linksConfig.social.instagram}
                className={navLinkVariants()}
                aria-label={t("navigation.social_instagram")}
              >
                <BrandInstagramIcon />
              </ExternalLink>
            </Tooltip>

            <Tooltip tooltip={t("navigation.social_linkedin")}>
              <ExternalLink
                href={linksConfig.social.linkedin}
                className={navLinkVariants()}
                aria-label={t("navigation.social_linkedin")}
              >
                <BrandLinkedInIcon />
              </ExternalLink>
            </Tooltip>
          </Stack>
        </Stack>

        <nav aria-label={t("navigation.browse")} className="flex flex-col gap-2 text-sm xl:col-span-2">
          <H6 as="strong">{t("navigation.browse")}:</H6>

          <NavLink href="/companies">{t("navigation.companies")}</NavLink>
          <NavLink href="/funders">{t("navigation.funders")}</NavLink>
          <NavLink href="/podcast">{t("navigation.podcasts")}</NavLink>
          <NavLink href="/case-studies">{t("navigation.case_studies")}</NavLink>
          <NavLink href="/sectors">{t("navigation.sectors")}</NavLink>
          <NavLink href="/focus">{t("navigation.focus_areas")}</NavLink>
          <NavLink href="/certifications">{t("navigation.certifications")}</NavLink>
          <NavLink href="/blog">{t("navigation.blog")}</NavLink>
        </nav>

        <nav
          aria-label={t("navigation.quick_links")}
          className="flex flex-col gap-2 text-sm xl:col-span-2"
        >
          <H6 as="strong">{t("navigation.quick_links")}:</H6>

          <NavLink href="/about">{t("navigation.about")}</NavLink>
          <NavLink href="/contact">{t("navigation.contact_us")}</NavLink>
          {adsConfig.enabled && <NavLink href="/advertise">{t("navigation.sponsor")}</NavLink>}
        </nav>

        <nav
          aria-label={t("navigation.resources")}
          className="flex flex-col gap-2 text-sm sm:col-span-2 xl:col-span-3"
        >
          <H6 as="strong">{t("navigation.resources")}:</H6>

          <NavLink href="/newsletter">{t("navigation.newsletter")}</NavLink>
          <NavLink href="/interviews">{t("navigation.interviews")}</NavLink>
          <NavLink href="/glossary">{t("navigation.glossary")}</NavLink>
          <NavLink href="/rss/tools.xml">{t("navigation.rss_feed")}</NavLink>
        </nav>
      </div>

      <FooterAskAI />

      {children}

      <div className="border-t border-foreground/10 pt-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-foreground hover:opacity-90"
        >
          <Image
            src="/favicon.png"
            alt=""
            width={20}
            height={20}
            className="size-5 shrink-0 object-contain"
          />
          <span>{t("components.footer.copyright")}</span>
        </Link>
      </div>
    </footer>
  )
}
