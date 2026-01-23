import { getTranslations } from "next-intl/server"
import type { ComponentProps } from "react"
import { ToolTier } from "~/.generated/prisma/client"
import { Link } from "~/components/common/link"
import { Listing } from "~/components/web/listing"
import { ToolList, ToolListSkeleton } from "~/components/web/tools/tool-list"
import { findTools } from "~/server/web/tools/queries"

type FeaturedToolsProps = Omit<ComponentProps<typeof Listing>, "title">

const FeaturedTools = async ({ ...props }: FeaturedToolsProps) => {
  const tools = await findTools({ where: { tier: ToolTier.Premium }, take: 6 })

  if (!tools.length) {
    return null
  }

  const t = await getTranslations("components.listings")

  return (
    <Listing
      title={t("featured_tools")}
      button={<Link href="/">{t("view_all_tools")}</Link>}
      {...props}
    >
      <ToolList tools={tools} />
    </Listing>
  )
}

const FeaturedToolsSkeleton = async ({ ...props }: FeaturedToolsProps) => {
  const t = await getTranslations("components.listings")

  return (
    <Listing title={t("featured_tools")} {...props}>
      <ToolListSkeleton />
    </Listing>
  )
}

export { FeaturedTools, FeaturedToolsSkeleton }
