import { getTranslations } from "next-intl/server"
import Link from "next/link"
import { H6 } from "~/components/common/heading"
import {
  prepareFooterLocationLinks,
  prepareFooterSectorLinks,
} from "~/lib/footer-discovery"
import { cx } from "~/lib/utils"
import {
  findDirectoryLocationCounts,
  findDirectorySectorCounts,
} from "~/server/web/directory/queries"

function LeaderLink({
  href,
  label,
  count,
  className,
}: {
  href: string
  label: string
  count: number
  className?: string
}) {
  return (
    <Link
      href={href}
      className={cx(
        "group flex min-w-0 items-baseline gap-2 text-sm text-muted-foreground hover:text-foreground",
        className,
      )}
    >
      <span className="min-w-0 truncate">{label}</span>
      <span
        className="mb-0.5 min-h-[0.75em] min-w-4 flex-1 border-b border-dotted border-foreground/20 group-hover:border-foreground/35"
        aria-hidden
      />
      <span className="shrink-0 tabular-nums text-foreground/80">{count}</span>
    </Link>
  )
}

export async function FooterDirectoryDiscovery() {
  const t = await getTranslations("components.footer")
  const [sectorFacets, locationFacets] = await Promise.all([
    findDirectorySectorCounts("companies"),
    findDirectoryLocationCounts("companies"),
  ])

  const sectors = prepareFooterSectorLinks(sectorFacets)
  const locations = prepareFooterLocationLinks(locationFacets)

  if (sectors.length === 0 && locations.length === 0) {
    return null
  }

  return (
    <div className="flex flex-col gap-10 border-t border-foreground/10 pt-8">
      {sectors.length > 0 && (
        <section>
          <H6 as="strong" className="mb-4 text-sm">
            {t("discovery_sectors_heading")}
          </H6>
          <nav aria-label={t("discovery_sectors_nav")}>
            <div className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-4">
              {sectors.map(item => (
                <LeaderLink key={item.href} href={item.href} label={item.label} count={item.count} />
              ))}
            </div>
          </nav>
          <p className="mt-4">
            <Link
              href="/sectors"
              className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
            >
              {t("view_all_sectors")}
            </Link>
          </p>
        </section>
      )}

      {locations.length > 0 && (
        <section>
          <H6 as="strong" className="mb-4 text-sm">
            {t("discovery_locations_heading")}
          </H6>
          <nav aria-label={t("discovery_locations_nav")}>
            <div className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-4">
              {locations.map(item => (
                <LeaderLink key={item.href} href={item.href} label={item.label} count={item.count} />
              ))}
            </div>
          </nav>
          <p className="mt-4">
            <Link
              href="/companies"
              className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
            >
              {t("view_all_locations")}
            </Link>
          </p>
        </section>
      )}
    </div>
  )
}
