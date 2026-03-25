import { adRouter } from "~/server/web/ads/router"
import { bookmarkRouter } from "~/server/web/bookmarks/router"
import { contactRouter } from "~/server/web/contact/router"
import { mediaRouter } from "~/server/web/media/router"
import { productRouter } from "~/server/web/products/router"
import { reportRouter } from "~/server/web/reports/router"
import { searchRouter } from "~/server/web/search/router"
import { subscribeRouter } from "~/server/web/subscribe/router"
import { toolRouter } from "~/server/web/tools/router"

export const webRouter = {
  search: searchRouter,
  bookmarks: bookmarkRouter,
  contact: contactRouter,
  subscribe: subscribeRouter,
  reports: reportRouter,
  tools: toolRouter,
  media: mediaRouter,
  ads: adRouter,
  products: productRouter,
}

export type WebRouter = typeof webRouter
