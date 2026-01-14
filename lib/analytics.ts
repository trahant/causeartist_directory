import { tryCatch } from "@primoui/utils"
import { siteConfig } from "~/config/site"
import { getPlausibleApi } from "~/services/plausible"

/**
 * Get the page analytics for a given page and period
 * @param page - The page to get the analytics for
 * @param period - The period to get the analytics for
 * @returns The number of pageviews for the given page and period
 */
export const getPlausiblePageviews = async (page: string, period: string | string[] = "30d") => {
  const { data, error } = await tryCatch(
    getPlausibleApi()
      .post({
        site_id: siteConfig.domain,
        metrics: ["pageviews"],
        date_range: period,
        filters: [["is", "event:page", [page]]],
      })
      .json<{ results: { metrics: [number]; dimensions: [] }[] }>(),
  )

  if (error) {
    console.error("Analytics error:", error)
    return 0
  }

  return data.results[0].metrics[0]
}

/**
 * Get the total visitors for a given period
 * @param period - The period to get the visitors for
 * @returns The number of total visitors for the given period grouped by day
 */
export const getPlausibleVisitors = async (period: string | string[] = "30d") => {
  const { data, error } = await tryCatch(
    getPlausibleApi()
      .post({
        site_id: siteConfig.domain,
        metrics: ["visitors"],
        date_range: period,
        dimensions: ["time:day"],
      })
      .json<{ results: { metrics: [number]; dimensions: [string] }[] }>(),
  )

  if (error) {
    console.error("Analytics error:", error)
    return {}
  }

  // Group visitors by date
  const visitorsByDate = data.results.reduce<Record<string, number>>((acc, curr) => {
    acc[curr.dimensions[0]] = curr.metrics[0]
    return acc
  }, {})

  return visitorsByDate
}
