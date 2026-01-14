import { format } from "date-fns"
import { cacheLife, cacheTag } from "next/cache"
import type { ComponentProps } from "react"
import { MetricChart } from "~/components/admin/metrics/metric-chart"
import type { Card } from "~/components/common/card"
import { env } from "~/env"
import { calculateMetricStats, fillMissingDates, getMetricDateRange } from "~/lib/metrics"
import { resend } from "~/services/resend"

const getSubscribers = async () => {
  "use cache"

  cacheTag("subscribers")
  cacheLife("hours")

  const { data, error } = await resend.contacts.list({
    audienceId: env.RESEND_AUDIENCE_ID,
  })

  if (error) {
    console.error("Subscribers error:", error)
    return { results: [], totalSubscribers: 0, averageSubscribers: 0 }
  }

  const { today, startDate } = getMetricDateRange()

  // Filter for active subscribers in the last 30 days
  const recentSubscribers = data!.data.filter(
    sub => !sub.unsubscribed && new Date(sub.created_at) >= startDate,
  )

  // Group subscribers by date
  const subscribersByDate = recentSubscribers.reduce<Record<string, number>>((acc, sub) => {
    const date = format(new Date(sub.created_at), "yyyy-MM-dd")
    acc[date] = (acc[date] || 0) + 1
    return acc
  }, {})

  const results = fillMissingDates(subscribersByDate, startDate, today)
  const { total, average } = calculateMetricStats(results)

  return { results, totalSubscribers: total, averageSubscribers: average }
}

const SubscriberMetric = async ({ ...props }: ComponentProps<typeof Card>) => {
  const { results, totalSubscribers, averageSubscribers } = await getSubscribers()

  return (
    <MetricChart
      header={{
        title: "Subscribers",
        value: totalSubscribers.toLocaleString(),
        note: "last 30 days",
      }}
      chart={{
        data: results,
        dataLabel: "Subscriber",
        average: averageSubscribers,
        cellClassName: "bg-chart-2",
      }}
      {...props}
    />
  )
}

export { SubscriberMetric }
