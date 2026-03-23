import { adRouter } from "~/server/admin/ads/router"
import { categoryRouter } from "~/server/admin/categories/router"
import { companyRouter } from "~/server/admin/companies/router"
import { funderRouter } from "~/server/admin/funders/router"
import { metricRouter } from "~/server/admin/metrics/router"
import { postRouter } from "~/server/admin/posts/router"
import { reportRouter } from "~/server/admin/reports/router"
import { tagRouter } from "~/server/admin/tags/router"
import { toolRouter } from "~/server/admin/tools/router"
import { userRouter } from "~/server/admin/users/router"

export const adminRouter = {
  metrics: metricRouter,
  tools: toolRouter,
  posts: postRouter,
  categories: categoryRouter,
  tags: tagRouter,
  ads: adRouter,
  users: userRouter,
  reports: reportRouter,
  companies: companyRouter,
  funders: funderRouter,
}

export type AdminRouter = typeof adminRouter
