import { Badge } from "~/components/common/badge"
import { Card, CardDescription, CardFooter, CardHeader } from "~/components/common/card"
import { Link } from "~/components/common/link"
import { LocationCountryFlag } from "~/components/web/location-country-flag"
import type { CompanyMany } from "~/server/web/companies/payloads"

function CompanyDirectoryCard({ company }: { company: CompanyMany }) {
  const subtitle = company.tagline ?? company.description ?? ""

  return (
    <Card>
      <Link
        href={`/companies/${company.slug}`}
        className="flex min-w-0 w-full flex-col gap-4 text-left"
      >
        <CardHeader>
          <div className="flex items-center gap-3">
            <img
              src={company.logoUrl ?? undefined}
              alt={company.name}
              className="size-8 rounded object-contain"
            />
            <span className="truncate text-sm font-semibold">{company.name}</span>
          </div>
        </CardHeader>

        <CardDescription>{subtitle}</CardDescription>
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

export function CompanyCardGrid({ companies }: { companies: CompanyMany[] }) {
  if (!companies.length) return null

  return (
    <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {companies.map(company => (
        <CompanyDirectoryCard key={company.id} company={company} />
      ))}
    </div>
  )
}
