"use server"

import { after } from "next/server"
import { adminActionClient } from "~/lib/safe-actions"
import { categorySchema } from "~/server/admin/categories/schema"
import { idSchema, idsSchema } from "~/server/admin/shared/schema"

export const upsertCategory = adminActionClient
  .inputSchema(categorySchema)
  .action(async ({ parsedInput: { id, tools, ...input }, ctx: { db, revalidate } }) => {
    const toolIds = tools?.map(id => ({ id }))

    const category = id
      ? await db.category.update({
          where: { id },
          data: {
            ...input,
            slug: input.slug || "",
            tools: { set: toolIds },
          },
        })
      : await db.category.create({
          data: {
            ...input,
            slug: input.slug || "",
            tools: { connect: toolIds },
          },
        })

    revalidate({
      paths: ["/admin/categories"],
      tags: ["categories", `category-${category.slug}`],
    })

    return category
  })

export const duplicateCategory = adminActionClient
  .inputSchema(idSchema)
  .action(async ({ parsedInput: { id }, ctx: { db, revalidate } }) => {
    const originalCategory = await db.category.findUnique({
      where: { id },
      include: { tools: { select: { id: true } } },
    })

    if (!originalCategory) {
      throw new Error("Category not found")
    }

    const newName = `${originalCategory.name} (Copy)`

    const duplicatedCategory = await db.category.create({
      data: {
        name: newName,
        slug: "", // Slug will be auto-generated
        label: originalCategory.label,
        description: originalCategory.description,
        tools: { connect: originalCategory.tools },
      },
    })

    revalidate({
      paths: ["/admin/categories"],
      tags: ["categories"],
    })

    return duplicatedCategory
  })

export const deleteCategories = adminActionClient
  .inputSchema(idsSchema)
  .action(async ({ parsedInput: { ids }, ctx: { db, revalidate } }) => {
    await db.category.deleteMany({
      where: { id: { in: ids } },
    })

    revalidate({
      paths: ["/admin/categories"],
      tags: ["categories"],
    })

    return true
  })
