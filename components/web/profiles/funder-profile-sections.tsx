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
import type { FunderOne } from "~/server/web/funders/payloads"

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

export async function FunderHeroBand({ funder }: { funder: FunderOne }) {
  if (!funder.heroImageUrl) return null

  return (
    <div className="w-full -mt-fluid-md pt-6 max-md:order-4">
      <div className="overflow-hidden rounded-xl border border-border bg-muted/30">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={funder.heroImageUrl}
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

export async function FunderSecondaryCtas({ funder }: { funder: FunderOne }) {
  const t = await getTranslations("profiles")
  const hasPortfolio = funder.portfolio.length > 0
  const hasPods = funder.podcastEpisodes.length > 0
  if (!hasPortfolio && !hasPods && !funder.applicationUrl) return null

  return (
    <Stack direction="row" wrap className="gap-2 max-md:order-4">
      {funder.applicationUrl ? (
        <Button variant="secondary" size="lg" suffix={<ArrowUpRightIcon />} asChild>
          <ExternalLink href={funder.applicationUrl} doFollow doTrack>
            Apply
          </ExternalLink>
        </Button>
      ) : null}
      {hasPortfolio ? (
        <Button variant="secondary" size="lg" asChild>
          <a href="#portfolio">{t("portfolio_heading")}</a>
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

export async function FunderTaxonomyBand({ funder }: { funder: FunderOne }) {
  const t = await getTranslations("profiles")
  const hasAny =
    funder.sectors.length > 0 || funder.subcategories.length > 0 || funder.stages.length > 0
  if (!hasAny) return null

  return (
    <Stack direction="column" className="w-full gap-3 max-md:order-8">
      <div className="flex flex-wrap gap-2">
        {funder.sectors.length > 0 ? (
          <>
            <span className="w-full text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("taxonomy_sectors")}
            </span>
            {funder.sectors.map(({ sector }) => (
              <Badge key={sector.id} size="lg" asChild>
                <Link href={`/funders/sector/${sector.slug}`}>{sector.name}</Link>
              </Badge>
            ))}
          </>
        ) : null}
        {funder.subcategories.length > 0 ? (
          <>
            <span className="mt-2 w-full text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("taxonomy_subcategories")}
            </span>
            {funder.subcategories.map(({ subcategory }) => (
              <Badge key={subcategory.id} size="lg" variant="soft" asChild>
                <Link href={`/funders/focus/${subcategory.slug}`}>{subcategory.name}</Link>
              </Badge>
            ))}
          </>
        ) : null}
        {funder.stages.length > 0 ? (
          <>
            <span className="mt-2 w-full text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("investment_stages_heading")}
            </span>
            {funder.stages.map(({ fundingStage }) => (
              <Badge key={fundingStage.slug} size="lg" variant="outline" asChild>
                <Link href={`/funders/stage/${fundingStage.slug}`}>{fundingStage.name}</Link>
              </Badge>
            ))}
          </>
        ) : null}
      </div>
    </Stack>
  )
}

export async function FunderProfileLocationsSection({ funder }: { funder: FunderOne }) {
  if (!funder.locations.length) return null
  const t = await getTranslations("profiles")

  return (
    <Stack direction="column" className="w-full max-md:order-4 gap-3">
      <H5 as="strong">{t("locations_heading")}</H5>
      <Stack className="gap-2">
        {funder.locations.map(({ location }) => (
          <Badge key={location.slug} size="lg" variant="soft" asChild>
            <Link
              href={`/funders/location/${location.slug}`}
              className="inline-flex items-center gap-1.5"
            >
              <LocationCountryFlag countryCode={location.countryCode} />
              <span>{location.name}</span>
            </Link>
          </Badge>
        ))}
        {funder.locations[0]?.location.region && (
          <Badge size="lg" variant="soft" asChild>
            <Link href={`/funders/region/${funder.locations[0].location.region}`}>
              {formatRegionLabel(funder.locations[0].location.region)}
            </Link>
          </Badge>
        )}
      </Stack>
    </Stack>
  )
}

export async function FunderKeyBenefitsSection({ funder }: { funder: FunderOne }) {
  const items = parseKeyBenefits(funder.keyBenefits)
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

export async function FunderPortfolioSection({ funder }: { funder: FunderOne }) {
  if (!funder.portfolio.length) return null
  const t = await getTranslations("profiles")

  return (
    <Stack direction="column" id="portfolio" className="w-full scroll-mt-24 max-md:order-5 gap-3">
      <H5 as="h2">{t("portfolio_heading")}</H5>
      <div className="grid gap-3 sm:grid-cols-2">
        {funder.portfolio.map(({ company }) => (
          <Link
            key={company.slug}
            href={`/companies/${company.slug}`}
            className={cx(
              "flex items-center gap-3 rounded-lg border border-border p-3 transition-colors",
              "hover:bg-muted/50",
            )}
          >
            {company.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={company.logoUrl} alt="" className="size-10 rounded object-contain" />
            ) : (
              <div className="size-10 rounded bg-muted" />
            )}
            <div className="min-w-0 flex-1">
              <p className="font-medium">{company.name}</p>
              {company.tagline ? (
                <p className="truncate text-sm text-muted-foreground">{company.tagline}</p>
              ) : null}
            </div>
            <ArrowUpRightIcon className="size-4 shrink-0 opacity-50" />
          </Link>
        ))}
      </div>
    </Stack>
  )
}

export async function FunderPodcastSection({ funder }: { funder: FunderOne }) {
  if (!funder.podcastEpisodes.length) return null
  const t = await getTranslations("profiles")

  return (
    <Stack
      direction="column"
      id="podcast-episodes"
      className="w-full scroll-mt-24 max-md:order-5 gap-3"
    >
      <H5 as="h2">{t("podcast_heading")}</H5>
      <ul className="list-none space-y-2 p-0">
        {funder.podcastEpisodes.map(({ episode }) => (
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
