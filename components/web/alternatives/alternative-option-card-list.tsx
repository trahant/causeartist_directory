import { ArrowUpRightIcon } from "lucide-react"
import { Badge } from "~/components/common/badge"
import { Button } from "~/components/common/button"
import { Card, CardDescription, CardHeader } from "~/components/common/card"
import { Link } from "~/components/common/link"
import { CompanyLogo } from "~/components/web/company-logo"
import { ExternalLink } from "~/components/web/external-link"
import type { findAlternativeTarget } from "~/server/web/alternatives/queries"

type AlternativeTarget = NonNullable<Awaited<ReturnType<typeof findAlternativeTarget>>>

export function AlternativeOptionCardList({ target }: { target: AlternativeTarget }) {
  if (!target.alternatives.length) return null

  return (
    <ul className="list-none space-y-3 p-0">
      {target.alternatives.map(({ alternativeCompany }, index) => (
        <li key={alternativeCompany.id}>
          <Card className="gap-3">
            <CardHeader className="gap-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="outline">#{index + 1}</Badge>
              </div>
              <div className="flex items-start gap-3">
                <CompanyLogo
                  logoUrl={alternativeCompany.logoUrl}
                  name={alternativeCompany.name}
                  className="size-10 rounded object-contain"
                />
                <div className="min-w-0 flex-1">
                  <Link href={`/companies/${alternativeCompany.slug}`} className="font-semibold hover:underline">
                    {alternativeCompany.name}
                  </Link>
                  <CardDescription className="mt-1 line-clamp-3">
                    {alternativeCompany.tagline ?? alternativeCompany.description ?? ""}
                  </CardDescription>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {alternativeCompany.sectors.slice(0, 3).map(({ sector }) => (
                      <Badge key={sector.id} variant="soft">
                        {sector.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardHeader>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" asChild>
                <Link href={`/companies/${alternativeCompany.slug}`}>
                  View profile
                  <ArrowUpRightIcon />
                </Link>
              </Button>
              {alternativeCompany.website ? (
                <Button variant="secondary" size="sm" asChild>
                  <ExternalLink href={alternativeCompany.website} doTrack doFollow>
                    Visit site
                    <ArrowUpRightIcon />
                  </ExternalLink>
                </Button>
              ) : null}
            </div>
          </Card>
        </li>
      ))}
    </ul>
  )
}
