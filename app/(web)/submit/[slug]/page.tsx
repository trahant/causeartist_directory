import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { cache, Suspense } from "react"
import { ToolTier } from "~/.generated/prisma/browser"
import { ProductListSkeleton } from "~/components/web/products/product-list"
import { ProductQuery } from "~/components/web/products/product-query"
import { Stats } from "~/components/web/stats"
import { Intro, IntroDescription, IntroTitle } from "~/components/web/ui/intro"
import { siteConfig } from "~/config/site"
import { getPageData, getPageMetadata } from "~/lib/pages"
import { toolOnePayload } from "~/server/web/tools/payloads"
import { db } from "~/services/db"

type Props = PageProps<"/submit/[slug]">

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
  const url = `/submit/${tool.slug}`
  const title = t(`${namespace}.upgrade.title`, { name })
  const description = t(`${namespace}.upgrade.description`, { name, siteName: siteConfig.name })

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
  const { tool, url, metadata } = await getData(props)
  const t = await getTranslations()

  const tierRank: Record<ToolTier, number> = {
    [ToolTier.Free]: 0,
    [ToolTier.Standard]: 1,
    [ToolTier.Premium]: 2,
  }

  return (
    <>
      <Intro alignment="center">
        <IntroTitle>{metadata.title}</IntroTitle>
        <IntroDescription>{metadata.description}</IntroDescription>
      </Intro>

      <Suspense fallback={<ProductListSkeleton />}>
        <ProductQuery
          searchParams={props.searchParams}
          checkoutData={{
            successUrl: `${url}/success`,
            cancelUrl: `${url}`,
            metadata: { tool: tool.slug },
          }}
          getProductProps={({ product }) => {
            const tier = product.metadata.tier as ToolTier | undefined

            // Only show listing products with a valid tier
            if (!tier) return null

            const name = product.name.replace(" Listing", "")
            const isDisabled = tierRank[tier] <= tierRank[tool.tier]
            const buttonLabel =
              tier === tool.tier
                ? t(`${namespace}.current_tier`, { name })
                : (product.metadata.label ?? t(`${namespace}.choose_tier`, { name }))

            return { product: { name }, isDisabled, buttonLabel }
          }}
        />
      </Suspense>

      <Stats className="my-4" />
    </>
  )
}
