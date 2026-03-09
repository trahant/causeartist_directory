import { withAdmin } from "~/lib/orpc"
import { findReports } from "~/server/admin/reports/queries"
import { reportListSchema, reportSchema } from "~/server/admin/reports/schema"
import { idsSchema } from "~/server/admin/shared/schema"

const list = withAdmin.input(reportListSchema).handler(async ({ input }) => {
  return findReports(input)
})

const update = withAdmin
  .input(reportSchema)
  .handler(async ({ input: { id, ...data }, context: { db } }) => {
    return db.report.update({
      where: { id },
      data,
    })
  })

const remove = withAdmin.input(idsSchema).handler(async ({ input: { ids }, context: { db } }) => {
  await db.report.deleteMany({
    where: { id: { in: ids } },
  })

  return true
})

export const reportRouter = {
  list,
  update,
  remove,
}
