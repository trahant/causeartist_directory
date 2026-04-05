import { adRouter } from "~/server/admin/ads/router"
import { authorRouter } from "~/server/admin/authors/router"
import { blogPostRouter } from "~/server/admin/blog-posts/router"
import { caseStudyRouter } from "~/server/admin/case-studies/router"
import { categoryRouter } from "~/server/admin/categories/router"
import { certificationAdminRouter } from "~/server/admin/certifications/router"
import { companyRouter } from "~/server/admin/companies/router"
import { funderRouter } from "~/server/admin/funders/router"
import { fundingStageRouter } from "~/server/admin/funding-stages/router"
import { locationRouter } from "~/server/admin/locations/router"
import { metricRouter } from "~/server/admin/metrics/router"
import { postRouter } from "~/server/admin/posts/router"
import { reportRouter } from "~/server/admin/reports/router"
import { sectorRouter } from "~/server/admin/sectors/router"
import { subcategoryRouter } from "~/server/admin/subcategories/router"
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
  sectors: sectorRouter,
  certifications: certificationAdminRouter,
  subcategories: subcategoryRouter,
  locations: locationRouter,
  fundingStages: fundingStageRouter,
  blogPosts: blogPostRouter,
  caseStudies: caseStudyRouter,
  authors: authorRouter,
}

export type AdminRouter = typeof adminRouter
