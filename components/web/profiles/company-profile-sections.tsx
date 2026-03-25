import { ArrowUpRightIcon } from "lucide-react"
import { getTranslations } from "next-intl/server"
import { Badge } from "~/components/common/badge"
import { Button } from "~/components/common/button"
import { H5 } from "~/components/common/heading"
import { Link } from "~/components/common/link"
import { Stack } from "~/components/common/stack"
import { ExternalLink } from "~/components/web/external-link"
import { LocationCountryFlag } from "~/components/web/location-country-flag"
import { parseKeyBenefits } from "~/lib/key-benefits"
import { episodeProfileHref } from "~/lib/podcast-links"
import { cx } from "~/lib/utils"
import type { CompanyOne } from "~/server/web/companies/payloads"

const formatRegionLabel = (region: string) => {
  const map: Record<string, string> = {
    "north-america": "North America",
    europe: "Europe",
    "asia-pacific": "Asia Pacific",
    "latin-america": "Latin America",
    africa: "Africa",
    "middle-east": "Middle East",
  }
  return map[region] ?? region
}

/** Tagline only; hero image is rendered separately after primary CTAs. */
export async function CompanyHeroBand({ company }: { company: CompanyOne }) {
  if (!company.tagline) return null

  return (
    <div className="-mt-fluid-md pt-4">
      <p className="text-lg leading-relaxed text-muted-foreground">{company.tagline}</p>
    </div>
  )
}

export async function CompanyHeroImageBand({ company }: { company: CompanyOne }) {
  if (!company.heroImageUrl) return null

  return (
    <div className="w-full -mt-fluid-md pt-6 max-md:order-4">
      <div className="overflow-hidden rounded-xl border border-border bg-muted/30">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={company.heroImageUrl}
          alt=""
          className="max-h-80 w-full object-cover"
          loading="eager"
          decoding="async"
          referrerPolicy="no-referrer"
        />
      </div>
    </div>
  )
}

export async function CompanySecondaryCtas({ company }: { company: CompanyOne }) {
  const t = await getTranslations("profiles")
  const hasCases = company.caseStudies.length > 0
  const hasPods = company.podcastEpisodes.length > 0
  if (!hasCases && !hasPods) return null

  return (
    <Stack direction="row" wrap className="gap-2 max-md:order-4">
      {hasCases ? (
        <Button variant="secondary" size="lg" asChild>
          <a href="#case-studies">{t("view_case_studies")}</a>
        </Button>
      ) : null}
      {hasPods ? (
        <Button variant="secondary" size="lg" asChild>
          <a href="#podcast-episodes">{t("listen_podcast")}</a>
        </Button>
      ) : null}
    </Stack>
  )
}

export async function CompanyTaxonomyBand({ company }: { company: CompanyOne }) {
  const t = await getTranslations("profiles")
  const hasAny =
    company.sectors.length > 0 ||
    company.subcategories.length > 0 ||
    company.certifications.length > 0
  if (!hasAny) return null

  return (
    <Stack direction="column" className="w-full gap-3 max-md:order-10">
      <div className="flex flex-wrap gap-2">
        {company.sectors.length > 0 ? (
          <>
            <span className="w-full text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("taxonomy_sectors")}
            </span>
            {company.sectors.map(({ sector }) => (
              <Badge key={sector.id} size="lg" asChild>
                <Link href={`/companies/sector/${sector.slug}`}>{sector.name}</Link>
              </Badge>
            ))}
          </>
        ) : null}
        {company.subcategories.length > 0 ? (
          <>
            <span className="mt-2 w-full text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("taxonomy_subcategories")}
            </span>
            {company.subcategories.map(({ subcategory }) => (
              <Badge key={subcategory.id} size="lg" variant="soft" asChild>
                <Link href={`/companies/focus/${subcategory.slug}`}>{subcategory.name}</Link>
              </Badge>
            ))}
          </>
        ) : null}
        {company.certifications.length > 0 ? (
          <>
            <span className="mt-2 w-full text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("taxonomy_certifications")}
            </span>
            {company.certifications.map(c => (
              <Badge key={c.certification.slug} size="lg" variant="outline" asChild>
                <Link href={`/certifications/${c.certification.slug}`}>{c.certification.name}</Link>
              </Badge>
            ))}
          </>
        ) : null}
      </div>
    </Stack>
  )
}

export async function CompanyProfileLocationsSection({ company }: { company: CompanyOne }) {
  if (!company.locations.length) return null
  const t = await getTranslations("profiles")

  return (
    <Stack direction="column" className="w-full max-md:order-4 gap-3">
      <H5 as="strong">{t("locations_heading")}</H5>
      <Stack className="gap-2">
        {company.locations.map(({ location }) => (
          <Badge key={location.slug} size="lg" variant="soft" asChild>
            <Link
              href={`/companies/location/${location.slug}`}
              className="inline-flex items-center gap-1.5"
            >
              <LocationCountryFlag countryCode={location.countryCode} />
              <span>{location.name}</span>
            </Link>
          </Badge>
        ))}
        {company.locations[0]?.location.region && (
          <Badge size="lg" variant="soft" asChild>
            <Link href={`/companies/region/${company.locations[0].location.region}`}>
              {formatRegionLabel(company.locations[0].location.region)}
            </Link>
          </Badge>
        )}
      </Stack>
    </Stack>
  )
}

export async function CompanyRetailLocationsSection({ company }: { company: CompanyOne }) {
  if (!company.retailLocations.length) return null
  const t = await getTranslations("profiles")

  return (
    <Stack direction="column" className="w-full max-md:order-4 gap-3">
      <H5 as="h2">{t("retail_stores_heading")}</H5>
      <ul className="list-none space-y-3 p-0">
        {company.retailLocations.map((store, i) => {
          const street = [store.addressLine1, store.addressLine2].filter(Boolean).join("\n")
          const cityParts = [store.city, store.region, store.postalCode].filter(Boolean).join(", ")
          return (
            <li key={`retail-${i}`} className="rounded-lg border border-border p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {store.countryCode ? (
                      <LocationCountryFlag countryCode={store.countryCode} />
                    ) : null}
                    <p className="font-medium">{store.label}</p>
                  </div>
                  {street ? (
                    <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{street}</p>
                  ) : null}
                  {cityParts ? <p className="mt-1 text-sm text-muted-foreground">{cityParts}</p> : null}
                </div>
                {store.url ? (
                  <Button variant="secondary" size="sm" asChild>
                    <ExternalLink href={store.url} doFollow>
                      {t("retail_open_maps")}
                    </ExternalLink>
                  </Button>
                ) : null}
              </div>
            </li>
          )
        })}
      </ul>
    </Stack>
  )
}

export async function CompanyKeyBenefitsSection({ company }: { company: CompanyOne }) {
  const items = parseKeyBenefits(company.keyBenefits)
  if (!items.length) return null
  const t = await getTranslations("profiles")

  return (
    <Stack direction="column" className="w-full max-md:order-4 gap-4">
      <H5 as="h2">{t("key_benefits_heading")}</H5>
      <ul className="list-none space-y-4 p-0">
        {items.map((item, i) => (
          <li key={i} className="border-b border-border/60 pb-4 last:border-0 last:pb-0">
            <p className="font-semibold text-foreground">{item.title}</p>
            {item.body ? <p className="mt-1 text-sm text-muted-foreground">{item.body}</p> : null}
          </li>
        ))}
      </ul>
    </Stack>
  )
}

export async function CompanyInvestorsSection({ company }: { company: CompanyOne }) {
  if (!company.funders.length) return null
  const t = await getTranslations("profiles")

  return (
    <Stack direction="column" className="w-full max-md:order-9 gap-3">
      <H5 as="h2">{t("investors_heading")}</H5>
      <div className="grid gap-3 sm:grid-cols-2">
        {company.funders.map(({ funder }) => (
          <Link
            key={funder.slug}
            href={`/funders/${funder.slug}`}
            className={cx(
              "flex items-center gap-3 rounded-lg border border-border p-3 transition-colors",
              "hover:bg-muted/50",
            )}
          >
            {funder.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={funder.logoUrl} alt="" className="size-10 rounded object-contain" />
            ) : (
              <div className="size-10 rounded bg-muted" />
            )}
            <span className="min-w-0 flex-1 font-medium">{funder.name}</span>
            <ArrowUpRightIcon className="size-4 shrink-0 opacity-50" />
          </Link>
        ))}
      </div>
    </Stack>
  )
}

export async function CompanyCaseStudiesSection({ company }: { company: CompanyOne }) {
  if (!company.caseStudies.length) return null
  const t = await getTranslations("profiles")

  return (
    <Stack direction="column" id="case-studies" className="w-full scroll-mt-24 max-md:order-5 gap-3">
      <H5 as="h2">{t("case_studies_heading")}</H5>
      <ul className="list-none space-y-3 p-0">
        {company.caseStudies.map(cs => (
          <li key={cs.slug}>
            <Link
              href={`/case-studies/${cs.slug}`}
              className="flex gap-3 rounded-lg border border-border p-3 hover:bg-muted/50"
            >
              {cs.heroImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={cs.heroImageUrl} alt="" className="size-16 rounded object-cover" />
              ) : null}
              <div className="min-w-0 flex-1">
                <p className="font-medium">{cs.title}</p>
                {cs.excerpt ? <p className="mt-1 text-sm text-muted-foreground">{cs.excerpt}</p> : null}
              </div>
              <ArrowUpRightIcon className="size-4 shrink-0 opacity-50" />
            </Link>
          </li>
        ))}
      </ul>
    </Stack>
  )
}

export async function CompanyPodcastSection({ company }: { company: CompanyOne }) {
  if (!company.podcastEpisodes.length) return null
  const t = await getTranslations("profiles")

  return (
    <Stack
      direction="column"
      id="podcast-episodes"
      className="w-full scroll-mt-24 max-md:order-5 gap-3"
    >
      <H5 as="h2">{t("podcast_heading")}</H5>
      <ul className="list-none space-y-2 p-0">
        {company.podcastEpisodes.map(({ episode }) => (
          <li key={episode.slug}>
            <Link
              href={episodeProfileHref(episode)}
              className="flex items-start justify-between gap-3 rounded-lg border border-border p-3 hover:bg-muted/50"
            >
              <div className="min-w-0">
                <p className="font-medium">{episode.title}</p>
                {episode.excerpt ? (
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{episode.excerpt}</p>
                ) : null}
              </div>
              <ArrowUpRightIcon className="size-4 shrink-0 opacity-50" />
            </Link>
          </li>
        ))}
      </ul>
    </Stack>
  )
}
