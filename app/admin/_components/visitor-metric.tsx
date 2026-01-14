import { cacheLife, cacheTag } from "next/cache"
import type { ComponentProps } from "react"
import { MetricChart } from "~/components/admin/metrics/metric-chart"
import type { Card } from "~/components/common/card"
import { getPlausibleVisitors } from "~/lib/analytics"
import { calculateMetricStats, fillMissingDates, getMetricDateRange } from "~/lib/metrics"

const getVisitors = async () => {
  "use cache"

  cacheTag("analytics")
  cacheLife("hours")

  const { today, startDate, dateRange } = getMetricDateRange()
  const visitors = await getPlausibleVisitors(dateRange)
  const results = fillMissingDates(visitors, startDate, today)
  const { total, average } = calculateMetricStats(results)

  return { results, totalVisitors: total, averageVisitors: average }
}

const VisitorMetric = async ({ ...props }: ComponentProps<typeof Card>) => {
  const { results, totalVisitors, averageVisitors } = await getVisitors()

  return (
    <MetricChart
      header={{
        title: "Visitors",
        value: totalVisitors.toLocaleString(),
        note: "last 30 days",
      }}
      chart={{
        data: results,
        dataLabel: "Visitor",
        average: averageVisitors,
        cellClassName: "bg-chart-4",
      }}
      {...props}
    />
  )
}

export { VisitorMetric }
