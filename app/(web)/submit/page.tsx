import { LockIcon } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { getTranslations } from "next-intl/server"
import { cache } from "react"
import { SubmitForm } from "~/app/(web)/submit/form"
import { Button } from "~/components/common/button"
import { Card, CardDescription, CardHeader } from "~/components/common/card"
import { Intro, IntroDescription, IntroTitle } from "~/components/web/ui/intro"
import { Section } from "~/components/web/ui/section"
import { siteConfig } from "~/config/site"
import { getServerSession } from "~/lib/auth"
import { getPageData, getPageMetadata } from "~/lib/pages"

// I18n page namespace
const namespace = "pages.submit"

// Get page data
const getData = cache(async () => {
  const t = await getTranslations()
  const url = "/submit"
  const title = t(`${namespace}.title`)
  const description = t(`${namespace}.description`, { siteName: siteConfig.name })

  return getPageData(url, title, description, {
    breadcrumbs: [{ url, title }],
  })
})

export const generateMetadata = async (): Promise<Metadata> => {
  const { url, metadata } = await getData()
  return getPageMetadata({ url, metadata })
}

export default async function () {
  const t = await getTranslations()
  const { metadata } = await getData()
  const session = await getServerSession()

  return (
    <>
      <Intro>
        <IntroTitle>{metadata.title}</IntroTitle>
        <IntroDescription>{metadata.description}</IntroDescription>
      </Intro>

      <Section>
        <Section.Content>
          {session?.user ? (
            <SubmitForm />
          ) : (
            <Card hover={false} className="items-center text-center py-8">
              <CardHeader className="items-center">
                <LockIcon className="size-8 text-muted-foreground" />
                <h3 className="text-lg font-medium">{t(`${namespace}.auth_required.title`)}</h3>
              </CardHeader>
              <CardDescription className="max-w-md">
                {t(`${namespace}.auth_required.description`)}
              </CardDescription>
              <Button asChild>
                <Link href="/auth/login?next=/submit">
                  {t(`${namespace}.auth_required.button`)}
                </Link>
              </Button>
            </Card>
          )}
        </Section.Content>
      </Section>
    </>
  )
}
