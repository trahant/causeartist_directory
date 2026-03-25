import { isTruthy } from "@primoui/utils"
import type { Prisma } from "~/.generated/prisma/client"
import type { FundingStageListParams } from "~/server/admin/funding-stages/schema"
import { db } from "~/services/db"

export const findAdminFundingStages = async (
  search: FundingStageListParams,
  where?: Prisma.FundingStageWhereInput,
) => {
  const { name, page, perPage, sort, operator } = search
  const offset = (page - 1) * perPage
  const orderBy = sort.map(item => ({ [item.id]: item.desc ? "desc" : "asc" }) as const)

  const expressions: (Prisma.FundingStageWhereInput | undefined)[] = [
    name ? { name: { contains: name, mode: "insensitive" } } : undefined,
  ]

  const whereQuery: Prisma.FundingStageWhereInput = {
    [operator.toUpperCase()]: expressions.filter(isTruthy),
  }

  const [fundingStages, fundingStagesTotal] = await db.$transaction([
    db.fundingStage.findMany({
      where: { ...whereQuery, ...where },
      orderBy: [...orderBy, { name: "asc" }],
      take: perPage,
      skip: offset,
      select: { id: true, name: true, slug: true, sortOrder: true },
    }),
    db.fundingStage.count({ where: { ...whereQuery, ...where } }),
  ])

  return {
    fundingStages,
    fundingStagesTotal,
    pageCount: Math.ceil(fundingStagesTotal / perPage),
  }
}

export const findFundingStageByIdForAdmin = async (id: string) => {
  return db.fundingStage.findUnique({ where: { id } })
}
