import "./styles.css"
import { MotionConfig } from "motion/react"
import type { Metadata } from "next"
import { NextIntlClientProvider } from "next-intl"
import { getLocale, getMessages, getTimeZone, getTranslations } from "next-intl/server"
import { ThemeProvider } from "next-themes"
import { NuqsAdapter } from "nuqs/adapters/next/app"
import { Search } from "~/components/common/search"
import { Toaster } from "~/components/common/toaster"
import { TooltipProvider } from "~/components/common/tooltip"
import { metadataConfig } from "~/config/metadata"
import { siteConfig } from "~/config/site"
import { SearchProvider } from "~/contexts/search-context"
import { fontSans } from "~/lib/fonts"

export const generateMetadata = async (): Promise<Metadata> => {
  const t = await getTranslations()

  return {
    metadataBase: new URL(siteConfig.url),
    title: {
      template: `%s – ${siteConfig.name}`,
      default: `${t("brand.tagline")} – ${siteConfig.name}`,
    },
    description: t("brand.description"),
    icons: { icon: [{ type: "image/png", url: "/favicon.png" }] },
    ...metadataConfig,
  }
}

export default async function ({ children }: LayoutProps<"/">) {
  const locale = await getLocale()
  const messages = await getMessages()
  const timeZone = await getTimeZone()

  return (
    <html
      lang="en"
      className={`${fontSans.variable} scroll-smooth`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body className="min-h-dvh flex flex-col bg-background text-foreground font-sans">
        <NextIntlClientProvider locale={locale} messages={messages} timeZone={timeZone}>
          <NuqsAdapter>
            <TooltipProvider delayDuration={250} skipDelayDuration={250}>
              <SearchProvider>
                <ThemeProvider attribute="class" disableTransitionOnChange>
                  <MotionConfig reducedMotion="user">{children}</MotionConfig>
                  <Toaster />
                  <Search />
                </ThemeProvider>
              </SearchProvider>
            </TooltipProvider>
          </NuqsAdapter>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
