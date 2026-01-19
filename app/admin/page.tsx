import { Suspense } from "react"
import { RevenueMetric } from "~/app/admin/_components/revenue-metric"
import { SubscriberMetric } from "~/app/admin/_components/subscriber-metric"
import { UserMetric } from "~/app/admin/_components/user-metric"
import { VisitorMetric } from "~/app/admin/_components/visitor-metric"
import { MetricChartSkeleton } from "~/components/admin/metrics/metric-chart"
import { MetricValue, MetricValueSkeleton } from "~/components/admin/metrics/metric-value"
import { H3 } from "~/components/common/heading"
import { Wrapper } from "~/components/common/wrapper"
import { db } from "~/services/db"

export default function () {
  const counters = [
    { label: "Tools", href: "/admin/tools", query: db.tool.count() },
    { label: "Categories", href: "/admin/categories", query: db.category.count() },
    { label: "Users", href: "/admin/users", query: db.user.count() },
  ]

  return (
    <Wrapper size="lg" gap="xs">
      <H3>Dashboard</H3>

      <div className="flex flex-col gap-4 lg:col-span-3">
        <div className="flex flex-wrap gap-4">
          {counters.map(counter => (
            <Suspense key={counter.label} fallback={<MetricValueSkeleton />}>
              <MetricValue label={counter.label} href={counter.href} query={counter.query} />
            </Suspense>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Suspense fallback={<MetricChartSkeleton />}>
            <VisitorMetric />
          </Suspense>

          <Suspense fallback={<MetricChartSkeleton />}>
            <RevenueMetric />
          </Suspense>

          <Suspense fallback={<MetricChartSkeleton />}>
            <SubscriberMetric />
          </Suspense>

          <Suspense fallback={<MetricChartSkeleton />}>
            <UserMetric />
          </Suspense>
        </div>
      </div>
    </Wrapper>
  )
}
