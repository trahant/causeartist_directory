import type { Metadata } from "next"
import Image from "next/image"
import * as fs from "node:fs"
import * as path from "node:path"
import { cache, Suspense } from "react"
import { Card, CardHeader } from "~/components/common/card"
import { H4 } from "~/components/common/heading"
import { Link } from "~/components/common/link"
import { AdCard, AdCardSkeleton } from "~/components/web/ads/ad-card"
import { FeaturedToolsIcons } from "~/components/web/listings/featured-tools-icons"
import { StructuredData } from "~/components/web/structured-data"
import { Breadcrumbs } from "~/components/web/ui/breadcrumbs"
import { Intro, IntroDescription, IntroTitle } from "~/components/web/ui/intro"
import { Section } from "~/components/web/ui/section"
import { getPageData, getPageMetadata } from "~/lib/pages"
import { generateCollectionPage } from "~/lib/structured-data"
import { findBlogPosts } from "~/server/web/blog/queries"
import type { BlogPostMany } from "~/server/web/blog/payloads"

const url = "/interviews"
const title = "Interviews | Causeartist"
const description =
  "In-depth interviews with founders, investors, and leaders in the impact economy."

const redirectsCsvPath = path.join(process.cwd(), "redirects.csv")

function getInterviewSlugsFromRedirectsCsv(): string[] {
  const raw = fs.readFileSync(redirectsCsvPath, "utf-8")

  const slugs = new Set<string>()
  for (const line of raw.split(/\r?\n/)) {
    if (!line.trim()) continue
    const [oldUrl, newUrl] = line.split(",").map(s => s.trim().replace(/^"|"$/g, ""))
    if (!newUrl?.startsWith("/interviews/")) continue

    const rest = newUrl.replace(/^\/interviews\//, "").replace(/\/+$/, "")
    const slug = rest.split("/")[0]?.trim()
    if (slug) slugs.add(slug)
  }

  return Array.from(slugs)
}

const getData = cache(async () => {
  const interviewSlugs = getInterviewSlugsFromRedirectsCsv()
  const posts =
    interviewSlugs.length === 0
      ? []
      : await findBlogPosts({
          where: {
            status: { in: ["draft", "published"] },
            slug: { in: interviewSlugs },
          },
        })
  const data = getPageData(url, title, description, {
    breadcrumbs: [{ url, title: "Interviews" }],
    structuredData: [generateCollectionPage(url, title, description)],
  })
  return { ...data, posts }
})

export const generateMetadata = async (): Promise<Metadata> => {
  const { url: pageUrl, metadata } = await getData()
  return getPageMetadata({ url: pageUrl, metadata })
}

function InterviewCard({ post }: { post: BlogPostMany }) {
  return (
    <Card hover asChild>
      <Link href={`/interviews/${post.slug}`}>
        {post.heroImageUrl && (
          <Image
            src={post.heroImageUrl}
            alt={post.title}
            width={1200}
            height={630}
            className="-m-5 mb-0 w-[calc(100%+2.5rem)] max-w-none aspect-video object-cover"
          />
        )}
        <CardHeader wrap={false}>
          <H4 as="h3" className="text-sm leading-snug!">
            {post.title}
          </H4>
        </CardHeader>
      </Link>
    </Card>
  )
}

export default async function InterviewsPage() {
  const { posts, metadata, breadcrumbs, structuredData } = await getData()

  return (
    <>
      <Breadcrumbs items={breadcrumbs} />

      <Intro>
        <IntroTitle>{metadata.title}</IntroTitle>
        <IntroDescription>{metadata.description}</IntroDescription>
      </Intro>

      <Section>
        <Section.Content>
          <div className="grid w-full grid-cols-1 place-content-start gap-5 md:grid-cols-2 lg:grid-cols-2">
            {posts.map((post: BlogPostMany) => (
              <InterviewCard key={post.id} post={post} />
            ))}
          </div>
          {posts.length === 0 && (
            <p className="text-muted-foreground">No interviews found.</p>
          )}
        </Section.Content>

        <Section.Sidebar className="max-h-(--sidebar-max-height)">
          <Suspense fallback={<AdCardSkeleton />}>
            <AdCard type="BlogPost" />
          </Suspense>
          <Suspense>
            <FeaturedToolsIcons />
          </Suspense>
        </Section.Sidebar>
      </Section>

      <StructuredData data={structuredData} />
    </>
  )
}
