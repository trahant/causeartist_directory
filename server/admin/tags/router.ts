import { ORPCError } from "@orpc/server"
import { withAdmin } from "~/lib/orpc"
import { generateUniqueSlug } from "~/lib/slugs"
import { idSchema, idsSchema } from "~/server/admin/shared/schema"
import { findTagList, findTags } from "~/server/admin/tags/queries"
import { tagListSchema, tagSchema } from "~/server/admin/tags/schema"

const list = withAdmin.input(tagListSchema).handler(async ({ input }) => {
  return findTags(input)
})

const lookup = withAdmin.handler(async () => {
  return findTagList()
})

const upsert = withAdmin
  .input(tagSchema)
  .handler(async ({ input, context: { db, revalidate } }) => {
    const { id, tools, ...data } = input
    const toolIds = tools?.map(id => ({ id }))
    const existing = await db.tag.findUnique({ where: { id }, select: { slug: true } })

    const slug = await generateUniqueSlug(
      data.slug || data.name,
      slug => db.tag.findUnique({ where: { slug }, select: { slug: true } }).then(Boolean),
      existing?.slug,
    )

    const tag = await db.tag.upsert({
      where: { id },
      create: {
        id,
        ...data,
        slug,
        tools: { connect: toolIds },
      },
      update: {
        ...data,
        slug,
        tools: { set: toolIds },
      },
    })

    revalidate({
      tags: ["tags", `tag-${tag.slug}`],
    })

    return tag
  })

const duplicate = withAdmin
  .input(idSchema)
  .handler(async ({ input: { id }, context: { db, revalidate } }) => {
    const tag = await db.tag.findUnique({
      where: { id },
      include: { tools: { select: { id: true } } },
    })

    if (!tag) {
      throw new ORPCError("NOT_FOUND", { message: "Tag not found" })
    }

    const name = `${tag.name} (Copy)`

    const slug = await generateUniqueSlug(name, slug =>
      db.tag.findUnique({ where: { slug }, select: { slug: true } }).then(Boolean),
    )

    const newTag = await db.tag.create({
      data: {
        name,
        slug,
        tools: { connect: tag.tools },
      },
    })

    revalidate({
      tags: ["tags"],
    })

    return newTag
  })

const remove = withAdmin
  .input(idsSchema)
  .handler(async ({ input: { ids }, context: { db, revalidate } }) => {
    await db.tag.deleteMany({
      where: { id: { in: ids } },
    })

    revalidate({
      tags: ["tags"],
    })

    return true
  })

export const tagRouter = {
  list,
  lookup,
  upsert,
  duplicate,
  remove,
}
