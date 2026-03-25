import { getTranslations } from "next-intl/server"
import { Badge } from "~/components/common/badge"
import { Card, CardDescription, CardFooter, CardHeader } from "~/components/common/card"
import { Link } from "~/components/common/link"
import { FunderCardHeader } from "~/components/web/funders/funder-card-header"
import { LocationCountryFlag } from "~/components/web/location-country-flag"
import { formatFunderType } from "~/lib/format-funder-type"
import type { DirectoryListItem } from "~/server/web/directory/queries"

export async function DirectoryResults({
  items,
  listingKind,
}: {
  items: DirectoryListItem[]
  listingKind: "companies" | "funders"
}) {
  const t = await getTranslations("directory.results")

  if (items.length === 0) {
    return (
      <p className="text-muted-foreground text-sm py-8">
        {listingKind === "companies" ? t("empty_companies") : t("empty_funders")}
      </p>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
      {items.map(row =>
        row.type === "company" ? (
          <CompanyDirectoryCard key={`c-${row.item.id}`} company={row.item} />
        ) : (
          <FunderDirectoryCard key={`f-${row.item.id}`} funder={row.item} />
        ),
      )}
    </div>
  )
}

function CompanyDirectoryCard({
  company,
}: {
  company: Extract<DirectoryListItem, { type: "company" }>["item"]
}) {
  const title = company.tagline ?? company.description ?? ""

  return (
    <Card>
      <Link
        href={`/companies/${company.slug}`}
        className="flex flex-col gap-4 w-full min-w-0 text-left"
      >
        <CardHeader>
          <div className="flex min-w-0 w-full gap-3">
            <img
              src={company.logoUrl ?? undefined}
              alt={company.name}
              className="size-8 shrink-0 rounded object-contain"
            />
            <div className="min-w-0 flex-1">
              <span className="text-pretty text-sm font-semibold wrap-break-word">{company.name}</span>
            </div>
          </div>
        </CardHeader>
        <CardDescription>{title}</CardDescription>
      </Link>
      <CardFooter>
        {company.sectors.slice(0, 3).map(s => (
          <Badge key={s.sector.slug}>{s.sector.name}</Badge>
        ))}
        {company.certifications
          .filter(c =>
            ["b-corp", "benefit-corporation"].includes(c.certification.slug),
          )
          .map(c => (
            <Link key={c.certification.slug} href={`/certifications/${c.certification.slug}`}>
              <Badge
                variant="outline"
                className="text-xs border-green-500 text-green-700"
              >
                {c.certification.name}
              </Badge>
            </Link>
          ))}
        {company.locations[0] && (
          <Link href={`/companies/location/${company.locations[0].location.slug}`}>
            <Badge variant="outline" className="text-xs inline-flex items-center gap-1.5 max-w-full min-w-0">
              <LocationCountryFlag countryCode={company.locations[0].location.countryCode} />
              <span className="truncate">{company.locations[0].location.name}</span>
            </Badge>
          </Link>
        )}
      </CardFooter>
    </Card>
  )
}

function FunderDirectoryCard({
  funder,
}: {
  funder: Extract<DirectoryListItem, { type: "funder" }>["item"]
}) {
  const desc = funder.description ?? ""

  return (
    <Card>
      <Link
        href={`/funders/${funder.slug}`}
        className="flex flex-col gap-4 w-full min-w-0 text-left"
      >
        <CardHeader>
          <FunderCardHeader
            logoUrl={funder.logoUrl}
            name={funder.name}
            typeLabel={formatFunderType(funder.type)}
          />
        </CardHeader>
        <CardDescription>{desc}</CardDescription>
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
