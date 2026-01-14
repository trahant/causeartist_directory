import { format } from "date-fns"
import { cacheLife, cacheTag } from "next/cache"
import type { ComponentProps } from "react"
import { MetricChart } from "~/components/admin/metrics/metric-chart"
import type { Card } from "~/components/common/card"
import { calculateMetricStats, fillMissingDates, getMetricDateRange } from "~/lib/metrics"
import { db } from "~/services/db"

const getUsers = async () => {
  "use cache"

  cacheTag("users")
  cacheLife("hours")

  const { today, startDate } = getMetricDateRange()

  const users = await db.user.findMany({
    where: { createdAt: { gte: startDate } },
  })

  // Group users by date
  const usersByDate = users.reduce<Record<string, number>>((acc, user) => {
    const date = format(user.createdAt, "yyyy-MM-dd")
    acc[date] = (acc[date] || 0) + 1
    return acc
  }, {})

  const results = fillMissingDates(usersByDate, startDate, today)
  const { total, average } = calculateMetricStats(results)

  return { results, totalUsers: total, averageUsers: average }
}

const UserMetric = async ({ ...props }: ComponentProps<typeof Card>) => {
  const { results, totalUsers, averageUsers } = await getUsers()

  return (
    <MetricChart
      header={{
        title: "Users",
        value: totalUsers.toLocaleString(),
        note: "last 30 days",
      }}
      chart={{
        data: results,
        dataLabel: "User",
        average: averageUsers,
        cellClassName: "bg-chart-1",
      }}
      {...props}
    />
  )
}

export { UserMetric }
