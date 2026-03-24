import { ORPCError } from "@orpc/server"
import { withAdmin } from "~/lib/orpc"
import { generateUniqueSlug } from "~/lib/slugs"
import { idSchema, idsSchema } from "~/server/admin/shared/schema"
import { findAdminBlogPosts, findBlogPostByIdForAdmin } from "~/server/admin/blog-posts/queries"
import { blogPostListSchema, blogPostUpsertSchema } from "~/server/admin/blog-posts/schema"

const list = withAdmin.input(blogPostListSchema).handler(async ({ input }) => {
  return findAdminBlogPosts(input)
})

const upsert = withAdmin
  .input(blogPostUpsertSchema)
  .handler(async ({ input, context: { db, revalidate } }) => {
    const {
      id,
      title,
      slug: slugInput,
      status,
      excerpt,
      content,
      heroImageUrl,
      seoTitle,
      seoDescription,
      publishedAt,
      authorId,
    } = input

    const existing = await db.blogPost.findUnique({ where: { id }, select: { slug: true } })
    const oldSlug = existing?.slug

    const slug = await generateUniqueSlug(
      slugInput || title,
      s =>
        db.blogPost.findFirst({ where: { slug: s, NOT: { id } }, select: { id: true } }).then(Boolean),
      existing?.slug,
    )

    if (authorId) {
      const author = await db.author.findUnique({ where: { id: authorId }, select: { id: true } })
      if (!author) {
        throw new ORPCError("BAD_REQUEST", { message: "Author not found" })
      }
    }

    await db.blogPost.upsert({
      where: { id },
      create: {
        id,
        title,
        slug,
        status,
        excerpt: excerpt ?? null,
        content: content ?? null,
        heroImageUrl: heroImageUrl ?? null,
        seoTitle: seoTitle ?? null,
        seoDescription: seoDescription ?? null,
        publishedAt: publishedAt ?? null,
        authorId: authorId ?? null,
      },
      update: {
        title,
        slug,
        status,
        excerpt: excerpt ?? null,
        content: content ?? null,
        heroImageUrl: heroImageUrl ?? null,
        seoTitle: seoTitle ?? null,
        seoDescription: seoDescription ?? null,
        publishedAt: publishedAt ?? null,
        authorId: authorId === undefined ? undefined : authorId,
      },
    })

    const tags = ["blog-posts", "blog-post", `blog-post-${slug}`]
    if (oldSlug && oldSlug !== slug) {
      tags.push(`blog-post-${oldSlug}`)
    }
    revalidate({ tags: [...new Set(tags)] })
    revalidate({ paths: ["/blog", `/blog/${slug}`] })
    if (oldSlug && oldSlug !== slug) {
      revalidate({ paths: [`/blog/${oldSlug}`] })
    }

    return db.blogPost.findUnique({ where: { id } })
  })

const remove = withAdmin
  .input(idsSchema)
  .handler(async ({ input: { ids }, context: { db, revalidate } }) => {
    const rows = await db.blogPost.findMany({
      where: { id: { in: ids } },
      select: { slug: true },
    })
    await db.blogPost.deleteMany({ where: { id: { in: ids } } })
    const tags = new Set<string>(["blog-posts"])
    for (const r of rows) {
      tags.add(`blog-post-${r.slug}`)
    }
    revalidate({ tags: [...tags] })
    revalidate({
      paths: ["/blog", ...rows.map(r => `/blog/${r.slug}`)],
    })
    return true
  })

const get = withAdmin.input(idSchema).handler(async ({ input: { id } }) => {
  const row = await findBlogPostByIdForAdmin(id)
  if (!row) throw new ORPCError("NOT_FOUND", { message: "Blog post not found" })
  return row
})

export const blogPostRouter = {
  list,
  get,
  upsert,
  remove,
}
