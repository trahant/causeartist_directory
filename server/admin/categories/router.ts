import { adminProcedure } from "~/lib/orpc"
import { findCategories, findCategoryList } from "~/server/admin/categories/queries"
import { categoryListSchema, categorySchema } from "~/server/admin/categories/schema"
import { idSchema, idsSchema } from "~/server/admin/shared/schema"

const list = adminProcedure.input(categoryListSchema).handler(async ({ input }) => {
  return findCategories(input)
})

const lookup = adminProcedure.handler(async () => {
  return findCategoryList()
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
      tags: ["categories"],
    })

    return true
  })

export const categoryRouter = {
  list,
  lookup,
  upsert,
  duplicate,
  remove,
}
