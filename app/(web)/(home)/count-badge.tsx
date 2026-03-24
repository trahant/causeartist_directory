import { formatNumber } from "@primoui/utils"
import { subDays } from "date-fns"
import { getTranslations } from "next-intl/server"
import { cacheLife, cacheTag } from "next/cache"
import { Badge } from "~/components/common/badge"
import { Link } from "~/components/common/link"
import { Ping } from "~/components/common/ping"
import { db } from "~/services/db"

const publishedWhere = { status: "published" as const }
const weekAgo = () => subDays(new Date(), 7)

const getCounts = async () => {
  "use cache"

  cacheTag("directory-count")
  cacheLife("directoryStats")

  const since = weekAgo()

  // Parallel counts — no transaction needed (avoids "Unable to start a transaction in the given time"
  // with PrismaPg + small pools under concurrent cached renders).
  const [companyTotal, funderTotal, companyNew, funderNew] = await Promise.all([
    db.company.count({ where: publishedWhere }),
    db.funder.count({ where: publishedWhere }),
    db.company.count({
      where: { ...publishedWhere, createdAt: { gte: since } },
    }),
    db.funder.count({
      where: { ...publishedWhere, createdAt: { gte: since } },
    }),
  ])

  const total = companyTotal + funderTotal
  const newTotal = companyNew + funderNew

  return [total, newTotal] as const
}

const CountBadge = async () => {
  const [count, newCount] = await getCounts()
  const t = await getTranslations("components.count_badge")

  return (
    <Badge
      prefix={<Ping className="text-brand-navy dark:text-primary" />}
      className="order-first"
      asChild
    >
      <Link href="/#directory">
        {newCount
          ? t("new_entries", { count: formatNumber(newCount) })
          : t("total_entries", { count: formatNumber(count) })}
      </Link>
    </Badge>
  )
}

const CountBadgeSkeleton = () => {
  return (
    <Badge
      prefix={<Ping className="text-brand-navy dark:text-primary" />}
      className="min-w-20 order-first pointer-events-none animate-pulse"
    >
      &nbsp;
    </Badge>
  )
}

export { CountBadge, CountBadgeSkeleton }
