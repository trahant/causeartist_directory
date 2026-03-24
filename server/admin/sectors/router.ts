import { ORPCError } from "@orpc/server"
import { withAdmin } from "~/lib/orpc"
import { generateUniqueSlug } from "~/lib/slugs"
import {
  revalidateDirectoryTaxonomy,
  sectorPublicPaths,
} from "~/server/admin/revalidate-directory"
import { idSchema, idsSchema } from "~/server/admin/shared/schema"
import { findAdminSectors, findSectorByIdForAdmin } from "~/server/admin/sectors/queries"
import { sectorListSchema, sectorUpsertSchema } from "~/server/admin/sectors/schema"

const list = withAdmin.input(sectorListSchema).handler(async ({ input }) => {
  return findAdminSectors(input)
})

const upsert = withAdmin
  .input(sectorUpsertSchema)
  .handler(async ({ input, context: { db, revalidate } }) => {
    const { id, name, slug: slugInput, heroText } = input
    const existing = await db.sector.findUnique({ where: { id }, select: { slug: true } })

    const slug = await generateUniqueSlug(
      slugInput || name,
      s => db.sector.findFirst({ where: { slug: s, NOT: { id } }, select: { id: true } }).then(Boolean),
      existing?.slug,
    )

    const oldSlug = existing?.slug

    await db.sector.upsert({
      where: { id },
      create: { id, name, slug, heroText: heroText ?? null },
      update: { name, slug, heroText: heroText ?? null },
    })

    revalidateDirectoryTaxonomy(revalidate)
    const paths = new Set<string>()
    if (oldSlug && oldSlug !== slug) {
      for (const p of sectorPublicPaths(oldSlug)) paths.add(p)
    }
    for (const p of sectorPublicPaths(slug)) paths.add(p)
    revalidate({ paths: [...paths] })

    return db.sector.findUnique({ where: { id } })
  })

const remove = withAdmin
  .input(idsSchema)
  .handler(async ({ input: { ids }, context: { db, revalidate } }) => {
    for (const id of ids) {
      const row = await db.sector.findUnique({
        where: { id },
        select: {
          slug: true,
          _count: { select: { companies: true, funders: true } },
        },
      })
      if (!row) continue
      if (row._count.companies > 0 || row._count.funders > 0) {
        throw new ORPCError("CONFLICT", {
          message: `Sector is still linked to companies or funders (id: ${id})`,
        })
      }
      await db.sector.delete({ where: { id } })
      revalidateDirectoryTaxonomy(revalidate)
      revalidate({ paths: [...sectorPublicPaths(row.slug)] })
    }
    return true
  })

const get = withAdmin.input(idSchema).handler(async ({ input: { id } }) => {
  const sector = await findSectorByIdForAdmin(id)
  if (!sector) throw new ORPCError("NOT_FOUND", { message: "Sector not found" })
  return sector
})

export const sectorRouter = {
  list,
  get,
  upsert,
  remove,
}
