import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { cache } from "react"
import { Intro, IntroDescription, IntroTitle } from "~/components/web/ui/intro"
import { siteConfig } from "~/config/site"
import { getPageData, getPageMetadata } from "~/lib/pages"
import { toolOnePayload } from "~/server/web/tools/payloads"
import { db } from "~/services/db"

type Props = PageProps<"/submit/[slug]/success">

// I18n page namespace
const namespace = "pages.submit"

// Get page data
const getData = cache(async ({ params }: Props) => {
  const { slug } = await params

  const tool = await db.tool.findFirst({
    where: { slug },
    select: toolOnePayload,
  })

  if (!tool) {
    notFound()
  }

  const t = await getTranslations()
  const name = tool.name
  const url = `/submit/${tool.slug}/success`
  const title = t(`${namespace}.success.title`, { name })
  const description = t(`${namespace}.success.description`, { name, siteName: siteConfig.name })

  const data = getPageData(url, title, description, {
    breadcrumbs: [{ url, title }],
  })

  return { tool, ...data }
})

export const generateMetadata = async (props: Props): Promise<Metadata> => {
  const { url, metadata } = await getData(props)
  return getPageMetadata({ url, metadata })
}

export default async function (props: Props) {
  const { metadata } = await getData(props)

  return (
    <Intro alignment="center">
      <IntroTitle>{metadata.title}</IntroTitle>
      <IntroDescription>{metadata.description}</IntroDescription>
    </Intro>
  )
}
