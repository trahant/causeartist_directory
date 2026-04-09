import { Badge } from "~/components/common/badge"
import { Card, CardDescription, CardFooter, CardHeader } from "~/components/common/card"
import { Link } from "~/components/common/link"
import { CompanyLogo } from "~/components/web/company-logo"
import type { findAlternativeTargets } from "~/server/web/alternatives/queries"

type AlternativeTarget = Awaited<ReturnType<typeof findAlternativeTargets>>[number]

function AlternativeTargetCard({ item }: { item: AlternativeTarget }) {
  const subtitle = item.alternativesSummary ?? item.tagline ?? item.description ?? ""

  return (
    <Card>
      <Link href={`/alternatives/${item.slug}`} className="flex min-w-0 w-full flex-col gap-4 text-left">
        <CardHeader>
          <div className="flex min-w-0 w-full gap-3">
            <CompanyLogo logoUrl={item.logoUrl} name={item.name} className="size-8 rounded object-contain" />
            <div className="min-w-0 flex-1">
              <span className="text-pretty text-sm font-semibold wrap-break-word">{item.name}</span>
            </div>
          </div>
        </CardHeader>
        <CardDescription>{subtitle}</CardDescription>
      </Link>

      <CardFooter>
        <Badge variant="outline">{item._count.alternatives} alternatives</Badge>
      </CardFooter>
    </Card>
  )
}

export function AlternativeTargetCardGrid({ items }: { items: AlternativeTarget[] }) {
  if (!items.length) return null

  return (
    <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {items.map(item => (
        <AlternativeTargetCard key={item.id} item={item} />
      ))}
    </div>
  )
}
