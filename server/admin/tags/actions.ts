"use server"

import { after } from "next/server"
import { adminActionClient } from "~/lib/safe-actions"
import { idSchema, idsSchema } from "~/server/admin/shared/schema"
import { tagSchema } from "~/server/admin/tags/schema"

export const upsertTag = adminActionClient
  .inputSchema(tagSchema)
  .action(async ({ parsedInput: { id, tools, ...input }, ctx: { db, revalidate } }) => {
    const toolIds = tools?.map(id => ({ id }))

    const tag = id
      ? await db.tag.update({
          where: { id },
          data: {
            ...input,
            slug: input.slug || "",
            tools: { set: toolIds },
          },
        })
      : await db.tag.create({
          data: {
            ...input,
            slug: input.slug || "",
            tools: { connect: toolIds },
          },
        })

    revalidate({
      paths: ["/admin/tags"],
      tags: ["tags", `tag-${tag.slug}`],
    })

    return tag
  })

export const duplicateTag = adminActionClient
  .inputSchema(idSchema)
  .action(async ({ parsedInput: { id }, ctx: { db, revalidate } }) => {
    const originalTag = await db.tag.findUnique({
      where: { id },
      include: { tools: { select: { id: true } } },
    })

    if (!originalTag) {
      throw new Error("Tag not found")
    }

    const newName = `${originalTag.name} (Copy)`

    const duplicatedTag = await db.tag.create({
      data: {
        name: newName,
        slug: "", // Slug will be auto-generated
        tools: { connect: originalTag.tools },
      },
    })

    revalidate({
      paths: ["/admin/tags"],
      tags: ["tags"],
    })

    return duplicatedTag
  })

export const deleteTags = adminActionClient
  .inputSchema(idsSchema)
  .action(async ({ parsedInput: { ids }, ctx: { db, revalidate } }) => {
    await db.tag.deleteMany({
      where: { id: { in: ids } },
    })

    revalidate({
      paths: ["/admin/tags"],
      tags: ["tags"],
    })

    return true
  })
