import * as z from "zod"
import { adminProcedure } from "~/lib/orpc"
import { findTags } from "~/server/admin/tags/queries"
import type { TagTableSchema } from "~/server/admin/tags/schema"
import { tagSchema } from "~/server/admin/tags/schema"
import { idSchema, idsSchema } from "~/server/admin/shared/schema"

const tagListSchema = z.object({
  name: z.string().default(""),
  sort: z
    .array(z.object({ id: z.string(), desc: z.boolean() }))
    .default([{ id: "name", desc: false }]),
  page: z.number().default(1),
  perPage: z.number().default(25),
  from: z.string().default(""),
  to: z.string().default(""),
  operator: z.enum(["and", "or"]).default("and"),
})

const list = adminProcedure.input(tagListSchema).handler(async ({ input }) => {
  return findTags(input as TagTableSchema)
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
      paths: ["/admin/tags"],
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
      paths: ["/admin/tags"],
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
      paths: ["/admin/tags"],
      tags: ["tags"],
    })

    return true
  })

export const tagRouter = {
  list,
  upsert,
  duplicate,
  remove,
}
