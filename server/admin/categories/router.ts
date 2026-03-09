import { ORPCError } from "@orpc/server"
import { withAdmin } from "~/lib/orpc"
import { generateUniqueSlug } from "~/lib/slugs"
import { findCategories, findCategoryList } from "~/server/admin/categories/queries"
import { categoryListSchema, categorySchema } from "~/server/admin/categories/schema"
import { idSchema, idsSchema } from "~/server/admin/shared/schema"

const list = withAdmin.input(categoryListSchema).handler(async ({ input }) => {
  return findCategories(input)
})

const lookup = withAdmin.handler(async () => {
  return findCategoryList()
})

const upsert = withAdmin
  .input(categorySchema)
  .handler(async ({ input, context: { db, revalidate } }) => {
    const { id, tools, ...data } = input
    const toolIds = tools?.map(id => ({ id }))
    const existing = await db.category.findUnique({ where: { id }, select: { slug: true } })

    const slug = await generateUniqueSlug(
      data.slug || data.name,
      slug => db.category.findUnique({ where: { slug }, select: { slug: true } }).then(Boolean),
      existing?.slug,
    )

    const category = await db.category.upsert({
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
      tags: ["categories", `category-${category.slug}`],
    })

    return category
  })

const duplicate = withAdmin
  .input(idSchema)
  .handler(async ({ input: { id }, context: { db, revalidate } }) => {
    const category = await db.category.findUnique({
      where: { id },
      include: { tools: { select: { id: true } } },
    })

    if (!category) {
      throw new ORPCError("NOT_FOUND", { message: "Category not found" })
    }

    const name = `${category.name} (Copy)`

    const slug = await generateUniqueSlug(name, slug =>
      db.category.findUnique({ where: { slug }, select: { slug: true } }).then(Boolean),
    )

    const newCategory = await db.category.create({
      data: {
        name,
        slug,
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

const remove = withAdmin
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
