import { ORPCError } from "@orpc/server"
import { withAdmin } from "~/lib/orpc"
import { generateUniqueSlug } from "~/lib/slugs"
import {
  focusPublicPaths,
  revalidateDirectoryTaxonomy,
} from "~/server/admin/revalidate-directory"
import { idSchema, idsSchema } from "~/server/admin/shared/schema"
import {
  findAdminSubcategories,
  findSubcategoryByIdForAdmin,
} from "~/server/admin/subcategories/queries"
import { subcategoryListSchema, subcategoryUpsertSchema } from "~/server/admin/subcategories/schema"

const list = withAdmin.input(subcategoryListSchema).handler(async ({ input }) => {
  return findAdminSubcategories(input)
})

const upsert = withAdmin
  .input(subcategoryUpsertSchema)
  .handler(async ({ input, context: { db, revalidate } }) => {
    const { id, name, slug: slugInput } = input
    const existing = await db.subcategory.findUnique({ where: { id }, select: { slug: true } })

    const slug = await generateUniqueSlug(
      slugInput || name,
      s =>
        db.subcategory
          .findFirst({ where: { slug: s, NOT: { id } }, select: { id: true } })
          .then(Boolean),
      existing?.slug,
    )

    const oldSlug = existing?.slug

    await db.subcategory.upsert({
      where: { id },
      create: { id, name, slug },
      update: { name, slug },
    })

    revalidateDirectoryTaxonomy(revalidate)
    const paths = new Set<string>()
    if (oldSlug && oldSlug !== slug) {
      for (const p of focusPublicPaths(oldSlug)) paths.add(p)
    }
    for (const p of focusPublicPaths(slug)) paths.add(p)
    revalidate({ paths: [...paths] })

    return db.subcategory.findUnique({ where: { id } })
  })

const remove = withAdmin
  .input(idsSchema)
  .handler(async ({ input: { ids }, context: { db, revalidate } }) => {
    for (const id of ids) {
      const row = await db.subcategory.findUnique({
        where: { id },
        select: {
          slug: true,
          _count: { select: { companies: true, funders: true } },
        },
      })
      if (!row) continue
      if (row._count.companies > 0 || row._count.funders > 0) {
        throw new ORPCError("CONFLICT", {
          message: `Focus area is still linked to companies or funders (id: ${id})`,
        })
      }
      await db.subcategory.delete({ where: { id } })
      revalidateDirectoryTaxonomy(revalidate)
      revalidate({ paths: [...focusPublicPaths(row.slug)] })
    }
    return true
  })

const get = withAdmin.input(idSchema).handler(async ({ input: { id } }) => {
  const row = await findSubcategoryByIdForAdmin(id)
  if (!row) throw new ORPCError("NOT_FOUND", { message: "Focus area not found" })
  return row
})

export const subcategoryRouter = {
  list,
  get,
  upsert,
  remove,
}
