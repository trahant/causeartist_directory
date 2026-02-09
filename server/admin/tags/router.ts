import { adminProcedure } from "~/lib/orpc"
import { idSchema, idsSchema } from "~/server/admin/shared/schema"
import { findTagList, findTags } from "~/server/admin/tags/queries"
import { tagListSchema, tagSchema } from "~/server/admin/tags/schema"

const list = adminProcedure.input(tagListSchema).handler(async ({ input }) => {
  return findTags(input)
})

const lookup = adminProcedure.handler(async () => {
  return findTagList()
})

const upsert = adminProcedure
  .input(tagSchema)
  .handler(async ({ input, context: { db, revalidate } }) => {
    const { id, tools, ...data } = input
    const toolIds = tools?.map(id => ({ id }))

    const tag = id
      ? await db.tag.update({
          where: { id },
          data: {
            ...data,
            slug: data.slug || "",
            tools: { set: toolIds },
          },
        })
      : await db.tag.create({
          data: {
            ...data,
            slug: data.slug || "",
            tools: { connect: toolIds },
          },
        })

    revalidate({
      tags: ["tags", `tag-${tag.slug}`],
    })

    return tag
  })

const duplicate = adminProcedure
  .input(idSchema)
  .handler(async ({ input: { id }, context: { db, revalidate } }) => {
    const tag = await db.tag.findUnique({
      where: { id },
      include: { tools: { select: { id: true } } },
    })

    if (!tag) {
      throw new Error("Tag not found")
    }

    const newTag = await db.tag.create({
      data: {
        name: `${tag.name} (Copy)`,
        slug: "",
        tools: { connect: tag.tools },
      },
    })

    revalidate({
      tags: ["tags"],
    })

    return newTag
  })

const remove = adminProcedure
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
