import { getTranslations } from "next-intl/server"
import type { ComponentProps } from "react"
import { Link } from "~/components/common/link"
import { FunderCardGrid } from "~/components/web/funders/funder-card-grid"
import { Listing } from "~/components/web/listing"
import type { FunderOne } from "~/server/web/funders/payloads"
import { findRelatedFunders } from "~/server/web/funders/queries"

type RelatedFundersProps = Omit<ComponentProps<typeof Listing>, "title"> & {
  funder: FunderOne
}

export async function RelatedFunders({ funder, ...props }: RelatedFundersProps) {
  const t = await getTranslations("components.listings")
  const funders = await findRelatedFunders({ slug: funder.slug })

  if (!funders.length) {
    return null
  }

  return (
    <Listing
      title={t("similar_funders")}
      button={<Link href="/funders">{t("view_all_funders")}</Link>}
      {...props}
    >
      <FunderCardGrid funders={funders} />
    </Listing>
  )
}

export async function RelatedFundersSkeleton({ funder: _funder, ...props }: RelatedFundersProps) {
  const t = await getTranslations("components.listings")

  return (
    <Listing title={t("similar_funders")} {...props}>
      <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-40 animate-pulse rounded-lg border bg-card" />
        ))}
      </div>
    </Listing>
  )
}
