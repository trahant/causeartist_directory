"use client"

import { useQuery } from "@tanstack/react-query"
import { MetricValue, MetricValueSkeleton } from "~/components/admin/metrics/metric-value"
import { orpc } from "~/lib/orpc-query"

const staleTime = 60 * 60 * 1000 // 1 hour

export function DashboardStats() {
  const { data: stats } = useQuery(orpc.admin.metrics.stats.queryOptions({ staleTime }))

  if (!stats) {
    return (
      <>
        <MetricValueSkeleton />
        <MetricValueSkeleton />
        <MetricValueSkeleton />
      </>
    )
  }

  const counters = [
    { label: "Tools", href: "/admin/tools", count: stats.toolCount },
    { label: "Categories", href: "/admin/categories", count: stats.categoryCount },
    { label: "Users", href: "/admin/users", count: stats.userCount },
  ]

  return (
    <>
      {counters.map(counter => (
        <MetricValue key={counter.label} {...counter} />
      ))}
    </>
  )
}
