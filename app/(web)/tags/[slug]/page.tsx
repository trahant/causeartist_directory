import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { cache, Suspense } from "react"
import { StructuredData } from "~/components/web/structured-data"
import { ToolListingSkeleton } from "~/components/web/tools/tool-listing"
import { ToolQuery } from "~/components/web/tools/tool-query"
import { Breadcrumbs } from "~/components/web/ui/breadcrumbs"
import { Intro, IntroTitle } from "~/components/web/ui/intro"
import { siteConfig } from "~/config/site"
import { getPageData, getPageMetadata } from "~/lib/pages"
import { generateCollectionPage } from "~/lib/structured-data"
import { findTag, findTagSlugs } from "~/server/web/tags/queries"

type Props = PageProps<"/tags/[slug]">

// I18n page namespace
const namespace = "pages.tag"

// Get page data
const getData = cache(async ({ params }: Props) => {
  const { slug } = await params
  const tag = await findTag({ where: { slug } })

  if (!tag) {
    notFound()
  }

  const t = await getTranslations()
  const url = `/tags/${tag.slug}`
  const title = t(`${namespace}.title`, { name: tag.name })
  const description = t(`${namespace}.description`, { name: tag.name, siteName: siteConfig.name })

  const data = getPageData(url, title, description, {
    breadcrumbs: [
      { url: "/tags", title: t("navigation.tags") },
      { url, title: tag.name },
    ],
    structuredData: [generateCollectionPage(url, title, description)],
  })

  return { tag, ...data }
})

export const generateStaticParams = async () => {
  const tags = await findTagSlugs({})
  return tags.map(({ slug }) => ({ slug }))
}

export const generateMetadata = async (props: Props): Promise<Metadata> => {
  const { url, metadata } = await getData(props)
  return getPageMetadata({ url, metadata })
}

export default async function (props: Props) {
  const { tag, metadata, breadcrumbs, structuredData } = await getData(props)
  const t = await getTranslations()
  const placeholder = t(`${namespace}.search.placeholder`, { name: tag.name.toLowerCase() })

  return (
    <>
      <Breadcrumbs items={breadcrumbs} />

      <Intro>
        <IntroTitle>{metadata.title}</IntroTitle>
      </Intro>

      <Suspense fallback={<ToolListingSkeleton />}>
        <ToolQuery
          searchParams={props.searchParams}
          where={{ tags: { some: { slug: tag.slug } } }}
          search={{ placeholder }}
          ad="Tools"
        />
      </Suspense>

      <StructuredData data={structuredData} />
    </>
  )
}
