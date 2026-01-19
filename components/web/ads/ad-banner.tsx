import { getTranslations } from "next-intl/server"
import type { ComponentProps } from "react"
import { Button } from "~/components/common/button"
import { Card } from "~/components/common/card"
import { AdBadge, AdLink } from "~/components/web/ads/ad-base"
import { Container } from "~/components/web/ui/container"
import { Favicon } from "~/components/web/ui/favicon"
import { cx } from "~/lib/utils"
import { findAdWithFallback } from "~/server/web/ads/actions"

export const AdBanner = async ({ className, ...props }: ComponentProps<typeof Card>) => {
  const type = "Banner"
  const t = await getTranslations("components.ads")
  const { data: ad } = await findAdWithFallback({ type })

  if (!ad) {
    return null
  }

  return (
    <Container className="z-49 mt-1">
      <Card
        className={cx("flex-row items-center gap-3 px-3 py-2.5 md:px-4", className)}
        asChild
        {...props}
      >
        <AdLink ad={ad} type={type} source="banner">
          <AdBadge className="leading-none max-sm:order-last" />

          <div className="text-xs leading-tight text-secondary-foreground mr-auto sm:text-sm">
            <Favicon
              src={ad.faviconUrl}
              title={ad.name}
              size={32}
              className="float-left align-middle p-0 mr-1.5 size-3.5 rounded-sm sm:size-4"
            />
            <strong className="font-medium text-foreground">{ad.name}</strong> — {ad.description}
          </div>

          <Button
            variant="secondary"
            size="sm"
            className="shrink-0 leading-none pointer-events-none max-sm:hidden"
            asChild
          >
            <span>{ad.buttonLabel || t("learn_more")}</span>
          </Button>
        </AdLink>
      </Card>
    </Container>
  )
}
