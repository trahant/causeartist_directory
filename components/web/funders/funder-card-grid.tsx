import { Badge } from "~/components/common/badge"
import { Card, CardDescription, CardFooter, CardHeader } from "~/components/common/card"
import { Link } from "~/components/common/link"
import { LocationCountryFlag } from "~/components/web/location-country-flag"
import { formatFunderType } from "~/lib/format-funder-type"
import type { FunderMany } from "~/server/web/funders/payloads"

function FunderDirectoryCard({ funder }: { funder: FunderMany }) {
  const subtitle = funder.description ?? ""

  return (
    <Card>
      <Link
        href={`/funders/${funder.slug}`}
        className="flex min-w-0 w-full flex-col gap-4 text-left"
      >
        <CardHeader>
          <div className="flex items-center gap-3">
            <img
              src={funder.logoUrl ?? undefined}
              alt={funder.name}
              className="size-8 rounded object-contain"
            />
            <span className="truncate text-sm font-semibold">{funder.name}</span>
            <Badge className="shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-600">
              {formatFunderType(funder.type)}
            </Badge>
          </div>
        </CardHeader>

        <CardDescription>{subtitle}</CardDescription>
      </Link>

      <CardFooter>
        {funder.sectors.slice(0, 3).map(s => (
          <Badge key={s.sector.slug}>{s.sector.name}</Badge>
        ))}
        {funder.locations[0] && (
          <Link href={`/funders/location/${funder.locations[0].location.slug}`}>
            <Badge variant="outline" className="text-xs inline-flex items-center gap-1.5 max-w-full min-w-0">
              <LocationCountryFlag countryCode={funder.locations[0].location.countryCode} />
              <span className="truncate">{funder.locations[0].location.name}</span>
            </Badge>
          </Link>
        )}
      </CardFooter>
    </Card>
  )
}

export function FunderCardGrid({ funders }: { funders: FunderMany[] }) {
  if (!funders.length) return null

  return (
    <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {funders.map(funder => (
        <FunderDirectoryCard key={funder.id} funder={funder} />
      ))}
    </div>
  )
}
