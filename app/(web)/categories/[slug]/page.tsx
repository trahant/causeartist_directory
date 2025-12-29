import { lcFirst } from "@primoui/utils"
import { noCase } from "change-case"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { cache, Suspense } from "react"
import { StructuredData } from "~/components/web/structured-data"
import { ToolListingSkeleton } from "~/components/web/tools/tool-listing"
import { ToolQuery } from "~/components/web/tools/tool-query"
import { Breadcrumbs } from "~/components/web/ui/breadcrumbs"
import { Intro, IntroDescription, IntroTitle } from "~/components/web/ui/intro"
import { siteConfig } from "~/config/site"
import { getPageData, getPageMetadata } from "~/lib/pages"
import { generateCollectionPage } from "~/lib/structured-data"
import { findCategory, findCategorySlugs } from "~/server/web/categories/queries"

type Props = PageProps<"/categories/[slug]">

// I18n page namespace
const namespace = "pages.category"

// Get page data
const getData = cache(async ({ params }: Props) => {
  const { slug } = await params
  const category = await findCategory({ where: { slug } })

  if (!category) {
    notFound()
  }

  const t = await getTranslations()
  const url = `/categories/${slug}`
  const title = category.label || t(`${namespace}.title`, { name: category.name })
  const name = lcFirst(category.description ?? noCase(title))
  const description = t(`${namespace}.description`, { name, siteName: siteConfig.name })

  const data = getPageData(url, title, description, {
    breadcrumbs: [
      { url: "/categories", title: t("navigation.categories") },
      { url, title: category.name },
    ],
    structuredData: [generateCollectionPage(url, title, description)],
  })

  return { category, ...data }
})

export const generateStaticParams = async () => {
  const categories = await findCategorySlugs({})
  return categories.map(({ slug }) => ({ slug }))
}

export const generateMetadata = async (props: Props): Promise<Metadata> => {
  const { url, metadata } = await getData(props)
  return getPageMetadata({ url, metadata })
}

export default async function (props: Props) {
  const { category, metadata, breadcrumbs, structuredData } = await getData(props)
  const t = await getTranslations()
  const placeholder = t(`${namespace}.search.placeholder`, { name: metadata.title.toLowerCase() })

  return (
    <>
      <Breadcrumbs items={breadcrumbs} />

      <Intro>
        <IntroTitle>{metadata.title}</IntroTitle>
        <IntroDescription className="max-w-3xl">{metadata.description}</IntroDescription>
      </Intro>

      <Suspense fallback={<ToolListingSkeleton />}>
        <ToolQuery
          searchParams={props.searchParams}
          where={{ categories: { some: { slug: category.slug } } }}
          search={{ placeholder }}
          ad="Tools"
        />
      </Suspense>

      <StructuredData data={structuredData} />
    </>
  )
}
