import { format } from "date-fns"
import { cacheLife, cacheTag } from "next/cache"
import type { ComponentProps } from "react"
import { MetricChart } from "~/components/admin/metrics/metric-chart"
import type { Card } from "~/components/common/card"
import { calculateMetricStats, fillMissingDates, getMetricDateRange } from "~/lib/metrics"
import { stripe } from "~/services/stripe"

const getRevenue = async () => {
  "use cache"

  cacheTag("revenue")
  cacheLife("hours")

  try {
    const { today, startDate } = getMetricDateRange()

    // Get payment intents for accurate revenue data
    const { data: paymentIntents } = await stripe.paymentIntents.list({
      created: { gte: Math.floor(startDate.getTime() / 1000) },
      limit: 100,
    })

    // Filter successful payments and group by date
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
}

const RevenueMetric = async ({ ...props }: ComponentProps<typeof Card>) => {
  const { results, totalRevenue, averageRevenue } = await getRevenue()

  return (
    <MetricChart
      header={{
        title: "Revenue",
        value: `$${totalRevenue.toLocaleString()}`,
        note: "last 30 days",
      }}
      chart={{
        data: results,
        dataPrefix: "$",
        average: averageRevenue,
        cellClassName: "bg-chart-5",
      }}
      {...props}
    />
  )
}

export { RevenueMetric }
