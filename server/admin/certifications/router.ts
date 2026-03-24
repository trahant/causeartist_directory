import { ORPCError } from "@orpc/server"
import { withAdmin } from "~/lib/orpc"
import { generateUniqueSlug } from "~/lib/slugs"
import {
  certificationPublicPaths,
  revalidateDirectoryTaxonomy,
} from "~/server/admin/revalidate-directory"
import { idSchema, idsSchema } from "~/server/admin/shared/schema"
import {
  findAdminCertifications,
  findCertificationByIdForAdmin,
} from "~/server/admin/certifications/queries"
import { certificationListSchema, certificationUpsertSchema } from "~/server/admin/certifications/schema"

const list = withAdmin.input(certificationListSchema).handler(async ({ input }) => {
  return findAdminCertifications(input)
})

const upsert = withAdmin
  .input(certificationUpsertSchema)
  .handler(async ({ input, context: { db, revalidate } }) => {
    const { id, name, slug: slugInput, description, logoUrl, website } = input
    const existing = await db.certification.findUnique({ where: { id }, select: { slug: true } })

    const slug = await generateUniqueSlug(
      slugInput || name,
      s =>
        db.certification
          .findFirst({ where: { slug: s, NOT: { id } }, select: { id: true } })
          .then(Boolean),
      existing?.slug,
    )

    const oldSlug = existing?.slug

    await db.certification.upsert({
      where: { id },
      create: {
        id,
        name,
        slug,
        description: description ?? null,
        logoUrl: logoUrl ?? null,
        website: website ?? null,
      },
      update: {
        name,
        slug,
        description: description ?? null,
        logoUrl: logoUrl ?? null,
        website: website ?? null,
      },
    })

    revalidateDirectoryTaxonomy(revalidate, ["certification", `certification-${slug}`])
    if (oldSlug && oldSlug !== slug) {
      revalidate({ tags: [`certification-${oldSlug}`] })
    }
    const paths = new Set<string>()
    if (oldSlug && oldSlug !== slug) {
      for (const p of certificationPublicPaths(oldSlug)) paths.add(p)
    }
    for (const p of certificationPublicPaths(slug)) paths.add(p)
    revalidate({ paths: [...paths] })

    return db.certification.findUnique({ where: { id } })
  })

const remove = withAdmin
  .input(idsSchema)
  .handler(async ({ input: { ids }, context: { db, revalidate } }) => {
    for (const id of ids) {
      const row = await db.certification.findUnique({
        where: { id },
        select: { slug: true, _count: { select: { companies: true } } },
      })
      if (!row) continue
      if (row._count.companies > 0) {
        throw new ORPCError("CONFLICT", {
          message: `Certification is still linked to companies (id: ${id})`,
        })
      }
      await db.certification.delete({ where: { id } })
      revalidateDirectoryTaxonomy(revalidate)
      revalidate({
        tags: [`certification-${row.slug}`],
        paths: [...certificationPublicPaths(row.slug)],
      })
    }
    return true
  })

const get = withAdmin.input(idSchema).handler(async ({ input: { id } }) => {
  const row = await findCertificationByIdForAdmin(id)
  if (!row) throw new ORPCError("NOT_FOUND", { message: "Certification not found" })
  return row
})

export const certificationAdminRouter = {
  list,
  get,
  upsert,
  remove,
}
