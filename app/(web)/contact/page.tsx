import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { cache } from "react"
import { ContactForm } from "~/components/web/contact-form"
import { StructuredData } from "~/components/web/structured-data"
import { Breadcrumbs } from "~/components/web/ui/breadcrumbs"
import { Intro, IntroDescription, IntroTitle } from "~/components/web/ui/intro"
import { Section } from "~/components/web/ui/section"
import { siteConfig } from "~/config/site"
import { getPageData, getPageMetadata } from "~/lib/pages"

const namespace = "pages.contact"

const getData = cache(async () => {
  const t = await getTranslations()
  const url = "/contact"
  const title = t(`${namespace}.title`)
  const description = t(`${namespace}.description`)

  return getPageData(url, title, description, {
    breadcrumbs: [{ url, title }],
  })
})

export const generateMetadata = async (): Promise<Metadata> => {
  const { url, metadata } = await getData()
  return getPageMetadata({ url, metadata })
}

export default async function ContactPage() {
  const { metadata, breadcrumbs, structuredData } = await getData()

  return (
    <>
      <Breadcrumbs items={breadcrumbs} />

      <Intro>
        <IntroTitle>{metadata.title}</IntroTitle>
        <IntroDescription>
          {metadata.description}{" "}
          {siteConfig.email ? (
            <>
              You can also email us directly at{" "}
              <a href={`mailto:${siteConfig.email}`} className="underline underline-offset-2">
                {siteConfig.email}
              </a>
              .
            </>
          ) : null}
        </IntroDescription>
      </Intro>

      <Section>
        <Section.Content className="max-w-3xl">
          <ContactForm />
        </Section.Content>
      </Section>

      <StructuredData data={structuredData} />
    </>
  )
}
