#!/usr/bin/env node
import * as fs from "node:fs"
import * as path from "node:path"
import { db } from "~/services/db"

const GHOST_FILE = path.join(process.cwd(), "ghost-export.json")

type GhostTag = { id: string; slug: string; name?: string }
type GhostPost = {
  id: string
  title: string
  slug: string | null
  html: string | null
  custom_excerpt: string | null
  published_at: string | null
  feature_image: string | null
  type: string
  status: string
  created_at: string
  updated_at: string
}
type GhostPostMeta = {
  post_id: string
  og_title: string | null
  og_description: string | null
}
type GhostDb = {
  db: Array<{
    data: {
      posts: GhostPost[]
      tags: GhostTag[]
      posts_tags: Array<{ post_id: string; tag_id: string }>
      posts_meta?: GhostPostMeta[]
    }
  }>
}

type ContentType =
  | { type: "PodcastEpisode"; show: "dfg" }
  | { type: "PodcastEpisode"; show: "iip" }
  | { type: "PodcastEpisode"; show: null }
  | { type: "CaseStudy" }
  | { type: "GlossaryTerm" }
  | { type: "BlogPost" }

function getTagSlugsForPost(
  postId: string,
  postsTags: Array<{ post_id: string; tag_id: string }>,
  tagsById: Map<string, GhostTag>,
): string[] {
  const tagIds = postsTags.filter(pt => pt.post_id === postId).map(pt => pt.tag_id)
  return tagIds.map(tid => tagsById.get(tid)?.slug ?? "").filter(Boolean)
}

function getContentType(tagSlugs: string[]): ContentType {
  if (tagSlugs.includes("dfg")) return { type: "PodcastEpisode", show: "dfg" }
  if (tagSlugs.includes("investing-in-impact")) return { type: "PodcastEpisode", show: "iip" }
  if (tagSlugs.includes("podcast")) return { type: "PodcastEpisode", show: null }
  if (tagSlugs.includes("case-study")) return { type: "CaseStudy" }
  if (tagSlugs.includes("glossary")) return { type: "GlossaryTerm" }
  return { type: "BlogPost" }
}

function parseDate(value: string | null): Date | null {
  if (value == null || value === "") return null
  const d = new Date(value)
  return isNaN(d.getTime()) ? null : d
}

async function main() {
  console.log("Reading", GHOST_FILE)
  let raw: string
  try {
    raw = fs.readFileSync(GHOST_FILE, "utf-8")
  } catch (e) {
    console.error("Failed to read file:", e)
    process.exit(1)
  }

  let exportData: GhostDb
  try {
    exportData = JSON.parse(raw) as GhostDb
  } catch (e) {
    console.error("Failed to parse JSON:", e)
    process.exit(1)
  }

  const data = exportData.db[0]?.data
  if (!data?.posts) {
    console.error("No posts in export")
    process.exit(1)
  }

  const tagsById = new Map<string, GhostTag>()
  for (const t of data.tags ?? []) {
    tagsById.set(t.id, t)
  }

  const metaByPostId = new Map<string, GhostPostMeta>()
  for (const m of data.posts_meta ?? []) {
    metaByPostId.set(m.post_id, m)
  }

  const posts = data.posts
  const postsTags = data.posts_tags ?? []

  let countPodcastDfg = 0
  let countPodcastIip = 0
  let countPodcastNoShow = 0
  let countCaseStudy = 0
  let countBlogPost = 0
  let countGlossaryTerm = 0
  let skippedPages = 0
  let skippedDrafts = 0
  let errorCount = 0
  let totalProcessed = 0

  for (const post of posts) {
    try {
      if (post.type === "page") {
        skippedPages++
        continue
      }
      if (post.status === "draft") {
        skippedDrafts++
        continue
      }
      const slug = post.slug?.trim()
      if (!slug) {
        errorCount++
        console.error("Skipped (no slug):", post.title)
        continue
      }

      const tagSlugs = getTagSlugsForPost(post.id, postsTags, tagsById)
      const contentType = getContentType(tagSlugs)
      const meta = metaByPostId.get(post.id)
      const ogTitle = meta?.og_title ?? null
      const ogDesc = meta?.og_description ?? null
      const excerpt = post.custom_excerpt ?? ogDesc ?? null
      const publishedAt = parseDate(post.published_at)

      if (contentType.type === "PodcastEpisode") {
        const show = contentType.show
        await db.podcastEpisode.upsert({
          where: { slug },
          create: {
            title: post.title,
            slug,
            status: "draft",
            show,
            content: post.html ?? null,
            description: excerpt,
            excerpt,
            heroImageUrl: post.feature_image ?? null,
            seoTitle: ogTitle ?? post.title,
            seoDescription: ogDesc ?? excerpt ?? null,
            publishedAt,
            spotifyUrl: null,
            appleUrl: null,
            youtubeUrl: null,
          },
          update: {
            title: post.title,
            status: "draft",
            show,
            content: post.html ?? null,
            description: excerpt,
            excerpt,
            heroImageUrl: post.feature_image ?? null,
            seoTitle: ogTitle ?? post.title,
            seoDescription: ogDesc ?? excerpt ?? null,
            publishedAt,
          },
        })
        if (show === "dfg") countPodcastDfg++
        else if (show === "iip") countPodcastIip++
        else countPodcastNoShow++
        console.log("Imported:", post.title, "→ PodcastEpisode", show ?? "(no show)")
      } else if (contentType.type === "CaseStudy") {
        await db.caseStudy.upsert({
          where: { slug },
          create: {
            title: post.title,
            slug,
            status: "draft",
            excerpt,
            content: post.html ?? null,
            heroImageUrl: post.feature_image ?? null,
            seoTitle: ogTitle ?? post.title,
            seoDescription: ogDesc ?? excerpt ?? null,
            publishedAt,
          },
          update: {
            title: post.title,
            status: "draft",
            excerpt,
            content: post.html ?? null,
            heroImageUrl: post.feature_image ?? null,
            seoTitle: ogTitle ?? post.title,
            seoDescription: ogDesc ?? excerpt ?? null,
            publishedAt,
          },
        })
        countCaseStudy++
        console.log("Imported:", post.title, "→ CaseStudy")
      } else if (contentType.type === "GlossaryTerm") {
        await db.glossaryTerm.upsert({
          where: { slug },
          create: {
            term: post.title,
            slug,
            status: "draft",
            definition: post.html ?? null,
            extendedContent: null,
            seoTitle: ogTitle ?? post.title,
            seoDescription: ogDesc ?? excerpt ?? null,
          },
          update: {
            term: post.title,
            status: "draft",
            definition: post.html ?? null,
            extendedContent: null,
            seoTitle: ogTitle ?? post.title,
            seoDescription: ogDesc ?? excerpt ?? null,
          },
        })
        countGlossaryTerm++
        console.log("Imported:", post.title, "→ GlossaryTerm")
      } else {
        await db.blogPost.upsert({
          where: { slug },
          create: {
            title: post.title,
            slug,
            status: "draft",
            excerpt,
            content: post.html ?? null,
            heroImageUrl: post.feature_image ?? null,
            seoTitle: ogTitle ?? post.title,
            seoDescription: ogDesc ?? excerpt ?? null,
            publishedAt,
          },
          update: {
            title: post.title,
            status: "draft",
            excerpt,
            content: post.html ?? null,
            heroImageUrl: post.feature_image ?? null,
            seoTitle: ogTitle ?? post.title,
            seoDescription: ogDesc ?? excerpt ?? null,
            publishedAt,
          },
        })
        countBlogPost++
        console.log("Imported:", post.title, "→ BlogPost")
      }

      totalProcessed++
    } catch (e) {
      errorCount++
      console.error("Error importing", post.title, "(", post.slug, "):", e)
    }
  }

  console.log("\n--- Summary ---")
  console.log("Total processed:", totalProcessed)
  console.log("PodcastEpisode (dfg):", countPodcastDfg)
  console.log("PodcastEpisode (iip):", countPodcastIip)
  console.log("PodcastEpisode (no show):", countPodcastNoShow)
  console.log("CaseStudy:", countCaseStudy)
  console.log("BlogPost:", countBlogPost)
  console.log("GlossaryTerm:", countGlossaryTerm)
  console.log("Skipped (pages):", skippedPages)
  console.log("Skipped (Ghost drafts):", skippedDrafts)
  console.log("Errors:", errorCount)
}

main().then(
  () => process.exit(0),
  e => {
    console.error(e)
    process.exit(1)
  },
)
