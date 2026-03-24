import { format } from "date-fns"
import { getPlausibleVisitors } from "~/lib/analytics"
import { calculateMetricStats, fillMissingDates, getMetricDateRange } from "~/lib/metrics"
import { withAdmin } from "~/lib/orpc"
import { stripe } from "~/services/stripe"

// -----------------------------------------------------------------------------
// Dashboard stats: resource counts
// -----------------------------------------------------------------------------
const stats = withAdmin.handler(async ({ context: { db } }) => {
  const [companyCount, funderCount, blogPostCount, userCount] = await db.$transaction([
    db.company.count(),
    db.funder.count(),
    db.blogPost.count(),
    db.user.count(),
  ])

  return { companyCount, funderCount, blogPostCount, userCount }
})

// -----------------------------------------------------------------------------
// Revenue metric: Stripe payment intents for last 30 days
// -----------------------------------------------------------------------------
const revenue = withAdmin.handler(async () => {
  try {
    if (!stripe) return { results: [], totalRevenue: 0, averageRevenue: 0 }
    const { today, startDate } = getMetricDateRange()

    const { data: paymentIntents } = await stripe.paymentIntents.list({
      created: { gte: Math.floor(startDate.getTime() / 1000) },
      limit: 100,
    })

    const revenueByDate = paymentIntents
      .filter(({ status }) => status === "succeeded")
      .reduce<Record<string, number>>((acc, paymentIntent) => {
        const date = format(new Date(paymentIntent.created * 1000), "yyyy-MM-dd")
        const amount = Math.round(paymentIntent.amount_received / 100)
        acc[date] = (acc[date] || 0) + amount
        return acc
      }, {})

    const results = fillMissingDates(revenueByDate, startDate, today)
    const { total, average } = calculateMetricStats(results)

    return { results, totalRevenue: total, averageRevenue: average }
  } catch (error) {
    console.error("Revenue error:", error)
    return { results: [], totalRevenue: 0, averageRevenue: 0 }
  }
})

// -----------------------------------------------------------------------------
// Visitor metric: Plausible analytics for last 30 days
// -----------------------------------------------------------------------------
const visitors = withAdmin.handler(async () => {
  const { today, startDate, dateRange } = getMetricDateRange()
  const visitorData = await getPlausibleVisitors(dateRange)
  const results = fillMissingDates(visitorData, startDate, today)
  const { total, average } = calculateMetricStats(results)

  return { results, totalVisitors: total, averageVisitors: average }
})

// -----------------------------------------------------------------------------
// User signups metric for last 30 days
// -----------------------------------------------------------------------------
const userMetric = withAdmin.handler(async ({ context: { db } }) => {
  const { today, startDate } = getMetricDateRange()

  const users = await db.user.findMany({
    where: { createdAt: { gte: startDate } },
  })

  const usersByDate = users.reduce<Record<string, number>>((acc, user) => {
    const date = format(user.createdAt, "yyyy-MM-dd")
    acc[date] = (acc[date] || 0) + 1
    return acc
  }, {})

  const results = fillMissingDates(usersByDate, startDate, today)
  const { total, average } = calculateMetricStats(results)

  return { results, totalUsers: total, averageUsers: average }
})

export const metricRouter = {
  stats,
  revenue,
  visitors,
  userMetric,
}
