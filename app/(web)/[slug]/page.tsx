import { removeQueryParams } from "@primoui/utils"
import { HashIcon } from "lucide-react"
import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { notFound } from "next/navigation"
import { cache, Suspense } from "react"
import { Badge } from "~/components/common/badge"
import { H2, H5 } from "~/components/common/heading"
import { Link } from "~/components/common/link"
import { Stack } from "~/components/common/stack"
import { AdCard, AdCardSkeleton } from "~/components/web/ads/ad-card"
import { FeaturedToolsIcons } from "~/components/web/listings/featured-tools-icons"
import { RelatedTools, RelatedToolsSkeleton } from "~/components/web/listings/related-tools"
import { Markdown } from "~/components/web/markdown"
import { Nav } from "~/components/web/nav"
import { OverlayImage } from "~/components/web/overlay-image"
import { StructuredData } from "~/components/web/structured-data"
import { ToolActions } from "~/components/web/tools/tool-actions"
import { ToolButton } from "~/components/web/tools/tool-button"
import { ToolPreviewAlert } from "~/components/web/tools/tool-preview-alert"
import { Backdrop } from "~/components/web/ui/backdrop"
import { Favicon } from "~/components/web/ui/favicon"
import { IntroDescription } from "~/components/web/ui/intro"
import { Section } from "~/components/web/ui/section"
import { Sticky } from "~/components/web/ui/sticky"
import { Tag } from "~/components/web/ui/tag"
import { VerifiedBadge } from "~/components/web/verified-badge"
import type { OpenGraphParams } from "~/lib/opengraph"
import { getPageData, getPageMetadata } from "~/lib/pages"
import { generateCollectionPage } from "~/lib/structured-data"
import { isToolPublished, isToolStandardTier } from "~/lib/tools"
import { findTool, findToolSlugs } from "~/server/web/tools/queries"

type Props = PageProps<"/[slug]">

// Get page data
const getData = cache(async ({ params }: Props) => {
  const { slug } = await params
  const tool = await findTool({ where: { slug } })

  if (!tool) {
    notFound()
  }

  const t = await getTranslations()
  const url = `/${tool.slug}`
  const title = `${tool.name}: ${tool.tagline}`
  const description = tool.description ?? ""

  const data = getPageData(url, title, description, {
    breadcrumbs: [
      { url: "/", title: t("navigation.tools") },
      { url, title: tool.name },
    ],
    structuredData: [generateCollectionPage(url, title, description)],
  })

  return { tool, ...data }
})

export const generateStaticParams = async () => {
  const tools = await findToolSlugs({})
  return tools.map(({ slug }) => ({ slug }))
}

export const generateMetadata = async (props: Props): Promise<Metadata> => {
  const { tool, url, metadata } = await getData(props)

  const ogImage: OpenGraphParams = {
    title: tool.name,
    description: String(tool.description),
    faviconUrl: String(tool.faviconUrl),
  }

  const robots = !isToolPublished(tool) ? { index: false, follow: false } : undefined

  return getPageMetadata({ url, metadata: { ...metadata, robots }, ogImage })
}

export default async function (props: Props) {
  const { tool, metadata, structuredData } = await getData(props)
  const t = await getTranslations()

  return (
    <>
      <Section>
        <Section.Content className="max-md:contents">
          <Sticky isOverlay>
            <Stack className="@container self-stretch">
              <Favicon src={tool.faviconUrl} title={tool.name} className="size-8" />

              <Stack className="flex-1 min-w-0">
                <H2 as="h1" className="leading-tight! truncate">
                  {tool.name}
                </H2>

                {tool.ownerId && <VerifiedBadge size="lg" />}
              </Stack>

              <Suspense>
                <ToolActions tool={tool} />
              </Suspense>

              <Backdrop />
            </Stack>
          </Sticky>

          {tool.description && (
            <IntroDescription className="-mt-fluid-md pt-4">{tool.description}</IntroDescription>
          )}

          {isToolPublished(tool) && (
            <Stack className="w-full -mt-fluid-md pt-8">
              <ToolButton tool={tool} className="md:min-w-36" />
            </Stack>
          )}

          <ToolPreviewAlert tool={tool} className="self-stretch max-md:order-2" />

          {isToolPublished(tool) && tool.screenshotUrl && (
            <OverlayImage
              href={tool.affiliateUrl || tool.websiteUrl}
              doFollow={isToolStandardTier(tool)}
              eventName="click_website"
              eventProps={{
                url: removeQueryParams(tool.websiteUrl),
                tier: tool.tier,
                source: "image",
              }}
              src={tool.screenshotUrl}
              alt={`Screenshot of ${tool.name} website`}
              loading="eager"
              className="self-stretch max-md:order-2"
            />
          )}

          {tool.content && <Markdown code={tool.content} className="max-md:order-4" />}

          {/* Categories */}
          {!!tool.categories.length && (
            <Stack direction="column" className="w-full max-md:order-5">
              <H5 as="strong">{t("navigation.categories")}:</H5>

              <Stack className="gap-2">
                {tool.categories?.map(({ slug, name }) => (
                  <Badge key={slug} size="lg" asChild>
                    <Link href={`/categories/${slug}`}>{name}</Link>
                  </Badge>
                ))}
              </Stack>
            </Stack>
          )}

          {/* Tags */}
          {!!tool.tags.length && (
            <Stack direction="column" className="w-full max-md:order-6">
              <H5 as="h4">{t("navigation.tags")}:</H5>

              <Stack>
                {tool.tags.map(tag => (
                  <Tag key={tag.slug} prefix={<HashIcon />} asChild>
                    <Link href={`/tags/${tag.slug}`}>{tag.slug}</Link>
                  </Tag>
                ))}
              </Stack>
            </Stack>
          )}

          <Stack className="w-full md:sticky md:bottom-2 md:z-10 max-md:order-7">
            <div className="absolute -inset-x-1 -bottom-3 -top-8 -z-1 pointer-events-none bg-background mask-t-from-66% max-md:hidden" />

            <Nav className="mr-auto" title={metadata.title} />
          </Stack>
        </Section.Content>

        <Section.Sidebar className="max-md:contents">
          {/* Advertisement */}
          <Suspense fallback={<AdCardSkeleton className="max-md:order-3" />}>
            <AdCard type="ToolPage" className="max-md:order-3" />
          </Suspense>

          {/* Featured */}
          <Suspense>
            <FeaturedToolsIcons className="max-md:order-8" />
          </Suspense>
        </Section.Sidebar>
      </Section>

      {/* Related */}
      <Suspense fallback={<RelatedToolsSkeleton tool={tool} />}>
        <RelatedTools tool={tool} />
      </Suspense>

      <StructuredData data={structuredData} />
    </>
  )
}
