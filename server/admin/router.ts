import { adminProcedure } from "~/lib/orpc"
import { adRouter } from "~/server/admin/ads/router"
import { categoryRouter } from "~/server/admin/categories/router"
import { reportRouter } from "~/server/admin/reports/router"
import { tagRouter } from "~/server/admin/tags/router"
import { toolRouter } from "~/server/admin/tools/router"
import { userRouter } from "~/server/admin/users/router"

// -----------------------------------------------------------------------------
// Health-check procedure to verify oRPC infrastructure
// -----------------------------------------------------------------------------
const ping = adminProcedure.handler(async () => {
  return { status: "ok" as const, timestamp: new Date().toISOString() }
})

// -----------------------------------------------------------------------------
// Admin router
// -----------------------------------------------------------------------------
export const adminRouter = {
  ping,
  tools: toolRouter,
  categories: categoryRouter,
  tags: tagRouter,
  ads: adRouter,
  users: userRouter,
  reports: reportRouter,
}

export type AdminRouter = typeof adminRouter
