#!/usr/bin/env node
import { db } from "~/services/db"

const TARGET_SLUGS = ["tonys-chocolonely", "tonys-chocolonely-case-study"] as const

function cleanGhostHtml(html: string): string {
  let out = html

  // Remove Ghost KG HTML card comments (they add noise and can affect spacing in some renderers)
  out = out.replaceAll(/<!--\s*kg-card-begin:[\s\S]*?-->\s*/gi, "")
  out = out.replaceAll(/\s*<!--\s*kg-card-end:[\s\S]*?-->/gi, "")

  // Remove empty paragraphs produced by Ghost exports
  out = out.replaceAll(/<p>(?:\s|&nbsp;|<br\s*\/?>)*<\/p>/gi, "")

  // Headings should not be wrapped in paragraphs
  out = out.replaceAll(/<p>\s*(<(?:h2|h3)\b[^>]*>[\s\S]*?<\/(?:h2|h3)>)\s*<\/p>/gi, "$1")

  // Convert "Label:" standalone strong paragraphs into h3 sections
  out = out.replaceAll(
    /<p>\s*<strong>\s*([^<]{3,80}?)\s*:\s*<\/strong>\s*<\/p>/gi,
    "<h3>$1</h3>",
  )

  // Convert fully-bold, short standalone paragraphs into h3 sections
  out = out.replaceAll(
    /<p>\s*<strong>\s*([^<]{3,80}?)\s*<\/strong>\s*<\/p>/gi,
    "<h3>$1</h3>",
  )

  // Normalize whitespace between block tags a bit (keeps HTML identical visually but easier to read/debug)
  out = out.replaceAll(/>\s+</g, ">\n<")
  out = out.trim()

  return out
}

async function main() {
  const caseStudy = await db.caseStudy.findFirst({
    where: { slug: { in: [...TARGET_SLUGS] } },
    select: { id: true, slug: true, title: true, content: true },
  })

  if (!caseStudy) {
    console.log(`Not found: ${TARGET_SLUGS.join(" or ")}`)
    return
  }

  const before = caseStudy.content ?? ""
  const after = cleanGhostHtml(before)

  if (after === before) {
    console.log(`No changes needed: ${caseStudy.slug} (${caseStudy.id})`)
    return
  }

  await db.caseStudy.update({
    where: { id: caseStudy.id },
    data: { content: after },
  })

  console.log(`Cleaned content: ${caseStudy.slug} → ${caseStudy.slug}`)
  console.log(`Chars: ${before.length} → ${after.length}`)
  console.log(`Title: ${caseStudy.title}`)
}

main().then(
  () => process.exit(0),
  e => {
    console.error(e)
    process.exit(1)
  },
)

