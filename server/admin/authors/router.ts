import { ORPCError } from "@orpc/server"
import { withAdmin } from "~/lib/orpc"
import { generateUniqueSlug } from "~/lib/slugs"
import { idSchema, idsSchema } from "~/server/admin/shared/schema"
import { findAdminAuthors, findAuthorByIdForAdmin } from "~/server/admin/authors/queries"
import { authorListSchema, authorUpsertSchema } from "~/server/admin/authors/schema"

/** Compact list for blog post author dropdown (no pagination). */
const lookup = withAdmin.handler(async ({ context: { db } }) => {
  return db.author.findMany({
    select: { id: true, name: true, slug: true },
    orderBy: { name: "asc" },
  })
})

const list = withAdmin.input(authorListSchema).handler(async ({ input }) => {
  return findAdminAuthors(input)
})

const get = withAdmin.input(idSchema).handler(async ({ input: { id } }) => {
  const author = await findAuthorByIdForAdmin(id)
  if (!author) throw new ORPCError("NOT_FOUND", { message: "Author not found" })
  return author
})

const upsert = withAdmin
  .input(authorUpsertSchema)
  .handler(async ({ input, context: { db, revalidate } }) => {
    const { id, name, slug: slugInput, bio, avatarUrl, twitter, linkedin } = input
    const existing = await db.author.findUnique({ where: { id }, select: { slug: true } })

    const slug = await generateUniqueSlug(
      slugInput || name,
      s =>
        db.author.findFirst({ where: { slug: s, NOT: { id } }, select: { id: true } }).then(Boolean),
      existing?.slug,
    )

    await db.author.upsert({
      where: { id },
      create: {
        id,
        name,
        slug,
        bio: bio ?? null,
        avatarUrl: avatarUrl ?? null,
        twitter: twitter ?? null,
        linkedin: linkedin ?? null,
      },
      update: {
        name,
        slug,
        bio: bio ?? null,
        avatarUrl: avatarUrl ?? null,
        twitter: twitter ?? null,
        linkedin: linkedin ?? null,
      },
    })

    revalidate({ tags: ["blog-posts"], paths: ["/blog"] })

    return db.author.findUnique({ where: { id } })
  })

const remove = withAdmin
  .input(idsSchema)
  .handler(async ({ input: { ids }, context: { db, revalidate } }) => {
    for (const id of ids) {
      const row = await db.author.findUnique({
        where: { id },
        select: { _count: { select: { posts: true } } },
      })
      if (!row) continue
      if (row._count.posts > 0) {
        throw new ORPCError("CONFLICT", {
          message: `Author still has blog posts assigned (id: ${id}). Reassign posts first.`,
        })
      }
      await db.author.delete({ where: { id } })
    }
    revalidate({ tags: ["blog-posts"], paths: ["/blog"] })
    return true
  })

export const authorRouter = {
  lookup,
  list,
  get,
  upsert,
  remove,
}
