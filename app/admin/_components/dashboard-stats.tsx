"use client"

import { useQuery } from "@tanstack/react-query"
import { MetricValue, MetricValueSkeleton } from "~/components/admin/metrics/metric-value"
import { orpc } from "~/lib/orpc-query"

const staleTime = 60 * 60 * 1000 // 1 hour

export function DashboardStats() {
  const { data: stats } = useQuery(
    orpc.metrics.stats.queryOptions({ input: { limit: 3 }, staleTime }),
  )

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
    {
      label: "Tools",
      href: "/admin/tools",
      count: stats.toolCount,
      items: stats.tools.map(t => ({ ...t, href: `/admin/tools/${t.id}` })),
    },
    {
      label: "Categories",
      href: "/admin/categories",
      count: stats.categoryCount,
      items: stats.categories.map(c => ({ ...c, href: `/admin/categories/${c.id}` })),
    },
    {
      label: "Users",
      href: "/admin/users",
      count: stats.userCount,
      items: stats.users.map(u => ({ ...u, href: `/admin/users/${u.id}` })),
    },
  ]

  return (
    <>
      {counters.map(counter => (
        <MetricValue key={counter.label} {...counter} />
      ))}
    </>
  )
}
