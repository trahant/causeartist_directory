import { Suspense } from "react"
import { RevenueMetric } from "~/app/admin/_components/revenue-metric"
import { UserMetric } from "~/app/admin/_components/user-metric"
import { VisitorMetric } from "~/app/admin/_components/visitor-metric"
import { MetricChartSkeleton } from "~/components/admin/metrics/metric-chart"
import { MetricValue, MetricValueSkeleton } from "~/components/admin/metrics/metric-value"
import { H3 } from "~/components/common/heading"
import { Wrapper } from "~/components/common/wrapper"
import { db } from "~/services/db"

const recentLimit = 3

const getRecentTools = async () => {
  const tools = await db.tool.findMany({
    select: { id: true, name: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: recentLimit,
  })

  return tools.map(t => ({ ...t, href: `/admin/tools/${t.id}` }))
}

const getRecentCategories = async () => {
  const categories = await db.category.findMany({
    select: { id: true, name: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: recentLimit,
  })

  return categories.map(c => ({ ...c, href: `/admin/categories/${c.id}` }))
}

const getRecentUsers = async () => {
  const users = await db.user.findMany({
    select: { id: true, name: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: recentLimit,
  })

  return users.map(u => ({ ...u, href: `/admin/users/${u.id}` }))
}

export default function () {
  const counters = [
    { label: "Tools", href: "/admin/tools", query: db.tool.count(), items: getRecentTools() },
    {
      label: "Categories",
      href: "/admin/categories",
      query: db.category.count(),
      items: getRecentCategories(),
    },
    { label: "Users", href: "/admin/users", query: db.user.count(), items: getRecentUsers() },
  ]

  return (
    <Wrapper size="lg" gap="xs">
      <H3>Dashboard</H3>

      <div className="flex flex-col gap-4 lg:col-span-3">
        <div className="grid grid-cols-md gap-4">
          {counters.map(counter => (
            <Suspense key={counter.label} fallback={<MetricValueSkeleton />}>
              <MetricValue
                label={counter.label}
                href={counter.href}
                query={counter.query}
                items={counter.items}
              />
            </Suspense>
          ))}

          <Suspense fallback={<MetricChartSkeleton />}>
            <VisitorMetric />
          </Suspense>

          <Suspense fallback={<MetricChartSkeleton />}>
            <RevenueMetric />
          </Suspense>

          <Suspense fallback={<MetricChartSkeleton />}>
            <UserMetric />
          </Suspense>
        </div>
      </div>
    </Wrapper>
  )
}
