import { ORPCError } from "@orpc/server"
import { withAdmin } from "~/lib/orpc"
import { generateUniqueSlug } from "~/lib/slugs"
import { revalidateDirectoryTaxonomy } from "~/server/admin/revalidate-directory"
import { idSchema, idsSchema } from "~/server/admin/shared/schema"
import { findAdminLocations, findLocationByIdForAdmin } from "~/server/admin/locations/queries"
import { locationListSchema, locationUpsertSchema } from "~/server/admin/locations/schema"

const list = withAdmin.input(locationListSchema).handler(async ({ input }) => {
  return findAdminLocations(input)
})

const upsert = withAdmin
  .input(locationUpsertSchema)
  .handler(async ({ input, context: { db, revalidate } }) => {
    const { id, name, slug: slugInput, country, region, countryCode } = input
    const existing = await db.location.findUnique({ where: { id }, select: { slug: true } })

    const slug = await generateUniqueSlug(
      slugInput || name,
      s =>
        db.location.findFirst({ where: { slug: s, NOT: { id } }, select: { id: true } }).then(Boolean),
      existing?.slug,
    )

    await db.location.upsert({
      where: { id },
      create: {
        id,
        name,
        slug,
        country: country ?? null,
        region: region ?? null,
        countryCode: countryCode ?? null,
      },
      update: {
        name,
        slug,
        country: country ?? null,
        region: region ?? null,
        countryCode: countryCode ?? null,
      },
    })

    revalidateDirectoryTaxonomy(revalidate)
    revalidate({ paths: ["/companies", "/funders"] })

    return db.location.findUnique({ where: { id } })
  })

const remove = withAdmin
  .input(idsSchema)
  .handler(async ({ input: { ids }, context: { db, revalidate } }) => {
    for (const id of ids) {
      const row = await db.location.findUnique({
        where: { id },
        select: { _count: { select: { companies: true, funders: true } } },
      })
      if (!row) continue
      if (row._count.companies > 0 || row._count.funders > 0) {
        throw new ORPCError("CONFLICT", {
          message: `Location is still linked to companies or funders (id: ${id})`,
        })
      }
      await db.location.delete({ where: { id } })
      revalidateDirectoryTaxonomy(revalidate)
      revalidate({ paths: ["/companies", "/funders"] })
    }
    return true
  })

const get = withAdmin.input(idSchema).handler(async ({ input: { id } }) => {
  const row = await findLocationByIdForAdmin(id)
  if (!row) throw new ORPCError("NOT_FOUND", { message: "Location not found" })
  return row
})

export const locationRouter = {
  list,
  get,
  upsert,
  remove,
}
