#!/usr/bin/env node
/**
 * Build redirects from Ghost export and sitemap URLs.
 * Outputs redirects.csv with old_url, new_url, status_code.
 */

import * as fs from "node:fs"
import * as path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, "..")
const GHOST_EXPORT = path.join(ROOT, "ghost-export.json")
const SITEMAP_CSV = path.join(ROOT, "sitemap-urls.csv")
const OUTPUT_CSV = path.join(ROOT, "redirects.csv")

type ContentType =
  | "dfg-podcast"
  | "iip-podcast"
  | "podcast"
  | "case-study"
  | "glossary"
  | "blog"

type GhostPost = { id: string; slug: string; title?: string }
type GhostTag = { id: string; slug: string }
type PostTag = { post_id: string; tag_id: string }

const CONTENT_TYPE_PRIORITY: { tagSlug: string; type: ContentType }[] = [
  { tagSlug: "dfg", type: "dfg-podcast" },
  { tagSlug: "investing-in-impact", type: "iip-podcast" },
  { tagSlug: "podcast", type: "podcast" },
  { tagSlug: "case-study", type: "case-study" },
  { tagSlug: "glossary", type: "glossary" },
]

function getContentType(tagSlugs: string[]): ContentType {
  for (const { tagSlug, type } of CONTENT_TYPE_PRIORITY) {
    if (tagSlugs.includes(tagSlug)) return type
  }
  return "blog"
}

function getNewUrl(type: ContentType, slug: string): string {
  switch (type) {
    case "dfg-podcast":
      return `/podcast/disruptors-for-good/${slug}`
    case "iip-podcast":
      return `/podcast/investing-in-impact/${slug}`
    case "podcast":
      return `/podcast/${slug}`
    case "case-study":
      return `/case-studies/${slug}`
    case "glossary":
      return `/glossary/${slug}`
    case "blog":
      return `/blog/${slug}`
  }
}

function getTagRedirectPath(tagSlug: string): string {
  switch (tagSlug) {
    case "dfg":
      return "/podcast/disruptors-for-good"
    case "investing-in-impact":
      return "/podcast/investing-in-impact"
    case "podcast":
      return "/podcast"
    case "case-study":
      return "/case-studies"
    case "glossary":
      return "/glossary"
    default:
      return "/blog"
  }
}

function normalizePath(urlOrPath: string): string {
  // Extract path from full URL or use as-is if already a path
  let pathPart = urlOrPath
  try {
    if (urlOrPath.startsWith("http")) {
      const u = new URL(urlOrPath)
      pathPart = u.pathname
    }
  } catch {
    // Not a URL, use as path
  }
  const normalized = pathPart.replace(/\/$/, "").replace(/^\//, "") || "/"
  return normalized.startsWith("/") ? normalized : `/${normalized}`
}

function parseCsv(content: string): string[][] {
  return content
    .split(/\r?\n/)
    .filter(Boolean)
    .map(line => line.split(",").map(c => c.trim().replace(/^"|"$/g, "")))
}

function main() {
  console.log("Build redirects from Ghost export and sitemap...")
  console.log("")

  // 1. Read and parse ghost-export.json
  let ghostRaw: string
  try {
    ghostRaw = fs.readFileSync(GHOST_EXPORT, "utf-8")
    console.log(`✓ Read ${GHOST_EXPORT}`)
  } catch (err) {
    console.error(`✗ Failed to read ${GHOST_EXPORT}:`, err)
    process.exit(1)
  }

  let ghost: { db: Array<{ data: Record<string, unknown[]> }> }
  try {
    ghost = JSON.parse(ghostRaw) as typeof ghost
  } catch (err) {
    console.error("✗ Failed to parse ghost-export.json:", err)
    process.exit(1)
  }

  const data = ghost.db[0]?.data
  if (!data?.posts || !Array.isArray(data.posts)) {
    console.error("✗ ghost-export.json missing db[0].data.posts")
    process.exit(1)
  }

  const posts = data.posts as GhostPost[]
  const tags = (data.tags ?? []) as GhostTag[]
  const postsTags = (data.posts_tags ?? []) as PostTag[]

  const tagById = new Map(tags.map(t => [t.id, t]))
  const postTagsByPostId = new Map<string, GhostTag[]>()
  for (const pt of postsTags) {
    const tag = tagById.get(pt.tag_id)
    if (tag) {
      const arr = postTagsByPostId.get(pt.post_id) ?? []
      arr.push(tag)
      postTagsByPostId.set(pt.post_id, arr)
    }
  }

  const postSlugs = new Set<string>()
  const redirects = new Map<string, { new_url: string; status_code: number }>()
  const typeCounts: Record<ContentType, number> = {
    "dfg-podcast": 0,
    "iip-podcast": 0,
    podcast: 0,
    "case-study": 0,
    glossary: 0,
    blog: 0,
  }
  const postsWithoutTags: GhostPost[] = []

  // 2. Process each post
  for (const post of posts) {
    postSlugs.add(post.slug)
    const postTags = postTagsByPostId.get(post.id) ?? []
    const tagSlugs = postTags.map(t => t.slug)

    if (tagSlugs.length === 0) {
      postsWithoutTags.push(post)
    }

    const type = getContentType(tagSlugs)
    typeCounts[type]++
    const newUrl = getNewUrl(type, post.slug)
    const oldPath = `/${post.slug}`
    redirects.set(oldPath, { new_url: newUrl, status_code: 301 })
  }

  console.log(`✓ Processed ${posts.length} posts`)
  console.log("")

  // 3. Read sitemap-urls.csv
  let sitemapRaw: string
  try {
    sitemapRaw = fs.readFileSync(SITEMAP_CSV, "utf-8")
    console.log(`✓ Read ${SITEMAP_CSV}`)
  } catch (err) {
    console.error(`✗ Failed to read ${SITEMAP_CSV}:`, err)
    process.exit(1)
  }

  const sitemapRows = parseCsv(sitemapRaw)
  const header = sitemapRows[0] ?? []
  const urlCol = header.findIndex(h => h.toLowerCase() === "url")
  if (urlCol < 0) {
    console.error("✗ sitemap-urls.csv missing 'URL' column")
    process.exit(1)
  }

  let sitemapUnmatched = 0

  for (let i = 1; i < sitemapRows.length; i++) {
    const row = sitemapRows[i]
    const url = row[urlCol]?.trim()
    if (!url) continue

    const fullPath = normalizePath(url)
    const pathSegments = fullPath.replace(/^\//, "").split("/").filter(Boolean)
    const firstSegment = pathSegments[0] ?? ""

    // Skip if already in redirects (from posts)
    if (redirects.has(fullPath)) continue

    // Handle /tag/[slug]/ and /tag/[slug]/page/N/
    const tagMatch = fullPath.match(/^\/tag\/([^/]+)/)
    if (tagMatch) {
      const tagSlug = tagMatch[1] ?? ""
      const dest = getTagRedirectPath(tagSlug)
      redirects.set(fullPath, { new_url: dest, status_code: 301 })
      sitemapUnmatched++
      continue
    }

    // Handle /author/[slug]/
    if (fullPath.startsWith("/author/")) {
      redirects.set(fullPath, { new_url: "/blog", status_code: 301 })
      sitemapUnmatched++
      continue
    }

    // Handle /page/N/, /archive/page/N/, pagination
    if (/^\/page\/\d+/.test(fullPath) || /^\/archive\//.test(fullPath)) {
      redirects.set(fullPath, { new_url: "/blog", status_code: 301 })
      sitemapUnmatched++
      continue
    }

    // Single-segment path (e.g. /best-website-builders)
    if (pathSegments.length <= 1) {
      const slug = firstSegment
      if (postSlugs.has(slug)) {
        // Already added from posts
        continue
      }
      redirects.set(fullPath, { new_url: slug ? `/blog/${slug}` : "/blog", status_code: 301 })
      sitemapUnmatched++
      continue
    }

    // Nested path (e.g. /tag/definition/page/5/) - use first segment for fallback
    redirects.set(fullPath, { new_url: firstSegment ? `/blog/${firstSegment}` : "/blog", status_code: 301 })
    sitemapUnmatched++
  }

  console.log("")

  // 4. Write redirects.csv
  const csvLines = ["old_url,new_url,status_code"]
  for (const [old_url, { new_url, status_code }] of [...redirects.entries()].sort()) {
    csvLines.push(`${old_url},${new_url},${status_code}`)
  }

  try {
    fs.writeFileSync(OUTPUT_CSV, csvLines.join("\n") + "\n", "utf-8")
    console.log(`✓ Wrote ${OUTPUT_CSV} (${redirects.size} redirects)`)
  } catch (err) {
    console.error(`✗ Failed to write ${OUTPUT_CSV}:`, err)
    process.exit(1)
  }

  // 5. Summary
  console.log("")
  console.log("--- Summary ---")
  console.log(`Total posts processed: ${posts.length}`)
  console.log("Count per content type:")
  for (const [type, count] of Object.entries(typeCounts)) {
    console.log(`  ${type}: ${count}`)
  }
  console.log(`Sitemap URLs not matched to Ghost post: ${sitemapUnmatched}`)
  if (postsWithoutTags.length > 0) {
    console.log(`Posts with no tags (need manual review): ${postsWithoutTags.length}`)
    postsWithoutTags.slice(0, 10).forEach(p => {
      console.log(`  - ${p.slug} (${p.title ?? "no title"})`)
    })
    if (postsWithoutTags.length > 10) {
      console.log(`  ... and ${postsWithoutTags.length - 10} more`)
    }
  }
  console.log("")
  console.log("Done.")
}

main()
