import { baseProcedure } from "~/lib/orpc"
import { webAdRouter } from "~/server/web/ads/router"
import { bookmarkRouter } from "~/server/web/bookmarks/router"
import { filterRouter } from "~/server/web/filters/router"
import { mediaRouter } from "~/server/web/media/router"
import { webProductRouter } from "~/server/web/products/router"
import { reportRouter } from "~/server/web/reports/router"
import { searchRouter } from "~/server/web/search/router"
import { subscribeRouter } from "~/server/web/subscribe/router"
import { webToolRouter } from "~/server/web/tools/router"

// -----------------------------------------------------------------------------
// Health-check procedure to verify oRPC infrastructure
// -----------------------------------------------------------------------------
const ping = baseProcedure.handler(async () => {
  return { status: "ok" as const, timestamp: new Date().toISOString() }
})

// -----------------------------------------------------------------------------
// Web router
// -----------------------------------------------------------------------------
export const webRouter = {
  ping,
  search: searchRouter,
  filters: filterRouter,
  bookmarks: bookmarkRouter,
  subscribe: subscribeRouter,
  reports: reportRouter,
  tools: webToolRouter,
  media: mediaRouter,
  ads: webAdRouter,
  products: webProductRouter,
}

export type WebRouter = typeof webRouter
