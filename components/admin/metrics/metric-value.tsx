"use client"

import { formatDistanceToNow } from "date-fns"
import { type ComponentProps, use } from "react"
import { MetricHeader, MetricHeaderSkeleton } from "~/components/admin/metrics/metric-header"
import { Card } from "~/components/common/card"
import { Link } from "~/components/common/link"
import { Skeleton } from "~/components/common/skeleton"
import { Stack } from "~/components/common/stack"
import { Tile, TileCaption, TileDivider, TileTitle } from "~/components/web/ui/tile"

type MetricItem = {
  id: string
  name: string
  href: string
  createdAt: Date
}

type MetricValueProps = ComponentProps<typeof Card> & {
  label: string
  href: string
  query: Promise<number>
  items?: Promise<MetricItem[]>
}

const MetricValue = ({ label, href, query, items, ...props }: MetricValueProps) => {
  const count = use(query)
  const recentItems = items ? use(items) : undefined

  return (
    <Card hover={false} {...props}>
      <Link href={href}>
        <MetricHeader title={label} value={count.toLocaleString()} />
      </Link>

      {recentItems && recentItems.length > 0 && (
        <Stack size="sm" direction="column" className="items-stretch w-full">
          {recentItems.map(item => (
            <Tile key={item.id} asChild>
              <Link href={item.href}>
                <TileTitle className="text-sm">{item.name}</TileTitle>
                <TileDivider />

                <TileCaption className="text-muted-foreground">
                  {formatDistanceToNow(item.createdAt, { addSuffix: true })}
                </TileCaption>
              </Link>
            </Tile>
          ))}
        </Stack>
      )}
    </Card>
  )
}

const MetricValueSkeleton = () => {
  return (
    <Card hover={false}>
      <MetricHeaderSkeleton />

      <div className="flex flex-col gap-1 w-full">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="w-full h-8" />
        ))}
      </div>
    </Card>
  )
}

export { MetricValue, MetricValueSkeleton }
