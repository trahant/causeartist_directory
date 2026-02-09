"use client"

import { useQuery } from "@tanstack/react-query"
import { MetricChart, MetricChartSkeleton } from "~/components/admin/metrics/metric-chart"
import { orpc } from "~/lib/orpc-query"

const staleTime = 60 * 60 * 1000 // 1 hour

export function UserMetric() {
  const { data } = useQuery(orpc.metrics.userMetric.queryOptions({ staleTime }))

  if (!data) {
    return <MetricChartSkeleton />
  }

  return (
    <MetricChart
      header={{
        title: "Users",
        value: data.totalUsers.toLocaleString(),
        note: "last 30 days",
      }}
      chart={{
        data: data.results,
        dataLabel: "User",
        average: data.averageUsers,
        cellClassName: "bg-chart-1",
      }}
    />
  )
}
