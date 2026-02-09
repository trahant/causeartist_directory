import { adminProcedure } from "~/lib/orpc"
import { findReports } from "~/server/admin/reports/queries"
import { reportListSchema, reportSchema } from "~/server/admin/reports/schema"
import { idsSchema } from "~/server/admin/shared/schema"

const list = adminProcedure.input(reportListSchema).handler(async ({ input }) => {
  return findReports(input)
})

const update = adminProcedure
  .input(reportSchema)
  .handler(async ({ input: { id, ...data }, context: { db, revalidate } }) => {
    const report = await db.report.update({
      where: { id },
      data,
    })

    revalidate({
      paths: ["/admin/reports"],
    })

    return report
  })

const remove = adminProcedure
  .input(idsSchema)
  .handler(async ({ input: { ids }, context: { db, revalidate } }) => {
    await db.report.deleteMany({
      where: { id: { in: ids } },
    })

    revalidate({
      paths: ["/admin/reports"],
    })

    return true
  })

export const reportRouter = {
  list,
  update,
  remove,
}
