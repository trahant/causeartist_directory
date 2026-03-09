"use client"

import { useQuery } from "@tanstack/react-query"
import { MetricChart, MetricChartSkeleton } from "~/components/admin/metrics/metric-chart"
import { orpc } from "~/lib/orpc-query"

const staleTime = 60 * 60 * 1000 // 1 hour

export function VisitorMetric() {
  const { data } = useQuery(orpc.admin.metrics.visitors.queryOptions({ staleTime }))

  if (!data) {
    return <MetricChartSkeleton />
  }

  return (
    <MetricChart
      header={{
        title: "Visitors",
        value: data.totalVisitors.toLocaleString(),
        note: "last 30 days",
      }}
      chart={{
        data: data.results,
        dataLabel: "Visitor",
        average: data.averageVisitors,
        cellClassName: "bg-chart-4",
      }}
    />
  )
}
