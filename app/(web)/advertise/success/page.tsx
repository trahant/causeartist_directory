import { tryCatch } from "@primoui/utils"
import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { notFound } from "next/navigation"
import { createLoader, parseAsString } from "nuqs/server"
import { cache } from "react"
import { AdForm } from "~/app/(web)/advertise/success/ad-form"
import { AdCard } from "~/components/web/ads/ad-card"
import { Intro, IntroDescription, IntroTitle } from "~/components/web/ui/intro"
import { Section } from "~/components/web/ui/section"
import { siteConfig } from "~/config/site"
import { getPageData, getPageMetadata } from "~/lib/pages"
import { cx } from "~/lib/utils"
import { adOnePayload } from "~/server/web/ads/payloads"
import { db } from "~/services/db"
import { stripe } from "~/services/stripe"

type Props = PageProps<"/advertise/success">

// I18n page namespace
const namespace = "pages.advertise.success"

// Get page data
const getData = cache(async ({ searchParams }: Props) => {
  const searchParamsLoader = createLoader({ sessionId: parseAsString.withDefault("") })
  const { sessionId } = await searchParamsLoader(searchParams)
  if (!stripe) notFound()
  const { data: session, error } = await tryCatch(stripe.checkout.sessions.retrieve(sessionId))

  if (error || session.status !== "complete") {
    notFound()
  }

  const t = await getTranslations()
  const url = "/advertise/success"
  const title = t(`${namespace}.title`)
  const description = t(`${namespace}.description`, { siteName: siteConfig.name })

  const data = getPageData(url, title, description, {
    breadcrumbs: [{ url, title }],
  })

  return { session, ...data }
})

export const generateMetadata = async (props: Props): Promise<Metadata> => {
  const { url, metadata } = await getData(props)
  return getPageMetadata({ url, metadata })
}

export default async function (props: PageProps<"/advertise/success">) {
  const { session, metadata } = await getData(props)

  const existingAd = await db.ad.findFirst({
    where: { sessionId: session.id },
    select: adOnePayload,
  })

  return (
    <>
      <Intro alignment="center">
        <IntroTitle>{metadata.title}</IntroTitle>
        <IntroDescription>{metadata.description}</IntroDescription>
      </Intro>

      <Section>
        <Section.Content className={cx(!existingAd && "md:col-span-full")}>
          <AdForm sessionId={session.id} ad={existingAd} className="w-full max-w-xl mx-auto" />
        </Section.Content>

        {existingAd && (
          <Section.Sidebar>
            <AdCard type="All" explicitAd={existingAd} />
          </Section.Sidebar>
        )}
      </Section>
    </>
  )
}
