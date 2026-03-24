import { ORPCError } from "@orpc/server"
import { withAdmin } from "~/lib/orpc"
import { generateUniqueSlug } from "~/lib/slugs"
import { revalidateDirectoryTaxonomy } from "~/server/admin/revalidate-directory"
import { idSchema, idsSchema } from "~/server/admin/shared/schema"
import {
  findAdminFundingStages,
  findFundingStageByIdForAdmin,
} from "~/server/admin/funding-stages/queries"
import { fundingStageListSchema, fundingStageUpsertSchema } from "~/server/admin/funding-stages/schema"

const list = withAdmin.input(fundingStageListSchema).handler(async ({ input }) => {
  return findAdminFundingStages(input)
})

const upsert = withAdmin
  .input(fundingStageUpsertSchema)
  .handler(async ({ input, context: { db, revalidate } }) => {
    const { id, name, slug: slugInput } = input
    const existing = await db.fundingStage.findUnique({ where: { id }, select: { slug: true } })

    const slug = await generateUniqueSlug(
      slugInput || name,
      s =>
        db.fundingStage
          .findFirst({ where: { slug: s, NOT: { id } }, select: { id: true } })
          .then(Boolean),
      existing?.slug,
    )

    await db.fundingStage.upsert({
      where: { id },
      create: { id, name, slug },
      update: { name, slug },
    })

    revalidateDirectoryTaxonomy(revalidate)
    revalidate({ paths: ["/funders"], tags: ["funders", "related-funders"] })

    return db.fundingStage.findUnique({ where: { id } })
  })

const remove = withAdmin
  .input(idsSchema)
  .handler(async ({ input: { ids }, context: { db, revalidate } }) => {
    for (const id of ids) {
      const row = await db.fundingStage.findUnique({
        where: { id },
        select: { _count: { select: { funders: true } } },
      })
      if (!row) continue
      if (row._count.funders > 0) {
        throw new ORPCError("CONFLICT", {
          message: `Funding stage is still linked to funders (id: ${id})`,
        })
      }
      await db.fundingStage.delete({ where: { id } })
      revalidateDirectoryTaxonomy(revalidate)
      revalidate({ paths: ["/funders"], tags: ["funders", "related-funders"] })
    }
    return true
  })

const get = withAdmin.input(idSchema).handler(async ({ input: { id } }) => {
  const row = await findFundingStageByIdForAdmin(id)
  if (!row) throw new ORPCError("NOT_FOUND", { message: "Funding stage not found" })
  return row
})

export const fundingStageRouter = {
  list,
  get,
  upsert,
  remove,
}
