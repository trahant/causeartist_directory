import * as z from "zod"
import { adminProcedure } from "~/lib/orpc"
import { findCategories } from "~/server/admin/categories/queries"
import type { CategoryTableSchema } from "~/server/admin/categories/schema"
import { categorySchema } from "~/server/admin/categories/schema"
import { idSchema, idsSchema } from "~/server/admin/shared/schema"

const categoryListSchema = z.object({
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

const list = adminProcedure.input(categoryListSchema).handler(async ({ input }) => {
  return findCategories(input as CategoryTableSchema)
})

const upsert = adminProcedure
  .input(categorySchema)
  .handler(async ({ input, context: { db, revalidate } }) => {
    const { id, tools, ...data } = input
    const toolIds = tools?.map(id => ({ id }))

    const category = id
      ? await db.category.update({
          where: { id },
          data: {
            ...data,
            slug: data.slug || "",
            tools: { set: toolIds },
          },
        })
      : await db.category.create({
          data: {
            ...data,
            slug: data.slug || "",
            tools: { connect: toolIds },
          },
        })

    revalidate({
      paths: ["/admin/categories"],
      tags: ["categories", `category-${category.slug}`],
    })

    return category
  })

const duplicate = adminProcedure
  .input(idSchema)
  .handler(async ({ input: { id }, context: { db, revalidate } }) => {
    const category = await db.category.findUnique({
      where: { id },
      include: { tools: { select: { id: true } } },
    })

    if (!category) {
      throw new Error("Category not found")
    }

    const newCategory = await db.category.create({
      data: {
        name: `${category.name} (Copy)`,
        slug: "",
        label: category.label,
        description: category.description,
        tools: { connect: category.tools },
      },
    })

    revalidate({
      paths: ["/admin/categories"],
      tags: ["categories"],
    })

    return newCategory
  })

const remove = adminProcedure
  .input(idsSchema)
  .handler(async ({ input: { ids }, context: { db, revalidate } }) => {
    await db.category.deleteMany({
      where: { id: { in: ids } },
    })

    revalidate({
      paths: ["/admin/categories"],
      tags: ["categories"],
    })

    return true
  })

export const categoryRouter = {
  list,
  upsert,
  duplicate,
  remove,
}
