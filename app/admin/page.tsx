import { DashboardStats } from "~/app/admin/_components/dashboard-stats"
import { RevenueMetric } from "~/app/admin/_components/revenue-metric"
import { UserMetric } from "~/app/admin/_components/user-metric"
import { VisitorMetric } from "~/app/admin/_components/visitor-metric"
import { H3 } from "~/components/common/heading"
import { Wrapper } from "~/components/common/wrapper"

export default function () {
  return (
    <Wrapper size="lg" gap="xs">
      <H3>Dashboard</H3>

      <div className="flex flex-col gap-4 lg:col-span-3">
        <div className="grid grid-cols-md gap-4">
          <DashboardStats />
          <VisitorMetric />
          <RevenueMetric />
          <UserMetric />
        </div>
      </div>
    </Wrapper>
  )
}
