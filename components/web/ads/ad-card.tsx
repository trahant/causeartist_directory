import { ArrowUpRightIcon } from "lucide-react"
import Image from "next/image"
import { getTranslations } from "next-intl/server"
import type { InferSafeActionFnInput } from "next-safe-action"
import type { ComponentProps } from "react"
import { Button } from "~/components/common/button"
import {
  Card,
  CardBadges,
  CardDescription,
  CardHeader,
  CardIcon,
  type CardProps,
} from "~/components/common/card"
import { H4 } from "~/components/common/heading"
import { Skeleton } from "~/components/common/skeleton"
import { AdBadge, AdLink } from "~/components/web/ads/ad-base"
import { Favicon } from "~/components/web/ui/favicon"
import { cx } from "~/lib/utils"
import { findAdWithFallback } from "~/server/web/ads/actions"

type AdCardProps = CardProps & InferSafeActionFnInput<typeof findAdWithFallback>["clientInput"]

const AdCard = async ({ className, type, explicitAd, fallback, ...props }: AdCardProps) => {
  const t = await getTranslations()
  const { data: ad } = await findAdWithFallback({ type, explicitAd, fallback })

  if (!ad) {
    return null
  }

  return (
    <Card className={cx("group/button", className)} asChild {...props}>
      <AdLink ad={ad} type={type} source="card">
        <CardBadges>
          <AdBadge />
        </CardBadges>

        {ad.bannerUrl ? (
          <Image
            src={ad.bannerUrl}
            alt={ad.name}
            width={400}
            height={225}
            className="max-w-none w-[calc(100%+2.5rem)] -m-5 rounded-md"
          />
        ) : (
          // Fallback to a custom banner
          <>
            <CardHeader wrap={false}>
              <Favicon src={ad.faviconUrl ?? "/favicon.png"} title={ad.name} contained />

              <H4 as="strong" className="truncate">
                {ad.name}
              </H4>
            </CardHeader>

            <CardDescription className="mb-auto pr-2 line-clamp-4">
              {ad.description}
            </CardDescription>

            <Button className="pointer-events-none md:w-full" suffix={<ArrowUpRightIcon />} asChild>
              <span>{ad.buttonLabel || t("common.visit", { name: ad.name })}</span>
            </Button>

            <CardIcon>
              <Favicon src={ad.faviconUrl} title={ad.name} />
            </CardIcon>
          </>
        )}
      </AdLink>
    </Card>
  )
}

const AdCardSkeleton = ({ className, ...props }: ComponentProps<typeof Card>) => {
  return (
    <Card hover={false} className={cx("items-stretch select-none", className)} {...props}>
      <CardBadges>
        <AdBadge />
      </CardBadges>

      <CardHeader>
        <Favicon src="/favicon.png" className="animate-pulse opacity-50" contained />

        <H4 className="w-2/3">
          <Skeleton>&nbsp;</Skeleton>
        </H4>
      </CardHeader>

      <CardDescription className="flex flex-col gap-0.5 mb-auto">
        <Skeleton className="h-5 w-full">&nbsp;</Skeleton>
        <Skeleton className="h-5 w-2/3">&nbsp;</Skeleton>
      </CardDescription>

      <Button className="pointer-events-none opacity-10 text-transparent md:w-full" asChild>
        <span>&nbsp;</span>
      </Button>
    </Card>
  )
}

export { AdCard, AdCardSkeleton }
