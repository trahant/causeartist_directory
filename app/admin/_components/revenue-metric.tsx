"use client"

import { useQuery } from "@tanstack/react-query"
import { MetricChart, MetricChartSkeleton } from "~/components/admin/metrics/metric-chart"
import { orpc } from "~/lib/orpc-query"

const staleTime = 60 * 60 * 1000 // 1 hour

export function RevenueMetric() {
  const { data } = useQuery(orpc.metrics.revenue.queryOptions({ staleTime }))

  if (!data) {
    return <MetricChartSkeleton />
  }

  return (
    <MetricChart
      header={{
        title: "Revenue",
        value: `$${data.totalRevenue.toLocaleString()}`,
        note: "last 30 days",
      }}
      chart={{
        data: data.results,
        dataPrefix: "$",
        average: data.averageRevenue,
        cellClassName: "bg-chart-5",
      }}
    />
  )
}
