"use client"

import { cx } from "cva"
import { endOfDay, startOfDay } from "date-fns"
import { XIcon } from "lucide-react"
import { useFormatter, useTranslations } from "next-intl"
import { useAction } from "next-safe-action/hooks"
import type { ComponentProps } from "react"
import { toast } from "sonner"
import { z } from "zod"
import { AdType } from "~/.generated/prisma/browser"
import { AnimatedContainer } from "~/components/common/animated-container"
import { Badge } from "~/components/common/badge"
import { Button } from "~/components/common/button"
import { Note } from "~/components/common/note"
import { Stack } from "~/components/common/stack"
import { Tooltip } from "~/components/common/tooltip"
import { AdsCalendar } from "~/components/web/ads/ads-calendar"
import { Price } from "~/components/web/price"
import { adsConfig } from "~/config/ads"
import { siteConfig } from "~/config/site"
import { type AdSpot, useAds } from "~/hooks/use-ads"
import { toUTCMidnight } from "~/lib/ads"
import type { AdMany } from "~/server/web/ads/payloads"
import { createStripeCheckout } from "~/server/web/products/actions"
import { checkoutSchema } from "~/server/web/products/schema"

type AdsCalendarProps = ComponentProps<"div"> & {
  ads: AdMany[]
  type: AdType | null
}

export const AdsPicker = ({ className, ads, type, ...props }: AdsCalendarProps) => {
  const t = useTranslations("ads")
  const format = useFormatter()

  // Ad spots available for purchase
  const spots = [
    {
      type: AdType.Tools,
      label: t("spots.listing.label"),
      description: t("spots.listing.description"),
      price: 25,
      preview: "https://share.cleanshot.com/7CFqSw0b",
    },
    {
      type: AdType.Banner,
      label: t("spots.banner.label"),
      description: t("spots.banner.description"),
      price: 25,
      preview: "https://share.cleanshot.com/SvqTztKT",
    },
    {
      type: AdType.ToolPage,
      label: t("spots.tool_page.label"),
      description: t("spots.tool_page.description"),
      price: 15,
      preview: "https://share.cleanshot.com/dXDbZPFv",
    },
  ] satisfies AdSpot[]

  const { price, selections, hasSelections, findAdSpot, clearSelection, updateSelection } =
    useAds(spots)

  const { execute, isPending } = useAction(createStripeCheckout, {
    onError: ({ error }) => {
      toast.error(error.serverError)
    },
  })

  const handleCheckout = () => {
    type LineItem = z.infer<typeof checkoutSchema>["lineItems"][number]

    const validSelections = selections.filter(({ dateRange, duration }) => {
      return dateRange?.from && dateRange?.to && duration
    })

    const lineItems = validSelections.map((selection): LineItem => {
      const adSpot = findAdSpot(selection.type)

      const discountedPrice = price?.discountPercentage
        ? adSpot.price * (1 - price.discountPercentage / 100)
        : adSpot.price

      return {
        price_data: {
          currency: siteConfig.currency,
          product_data: { name: `${selection.type} Ad` },
          unit_amount: Math.round(discountedPrice * 100),
        },
        quantity: selection.duration ?? 1,
      }
    })

    const adData = validSelections.map(selection => ({
      type: selection.type,
      startsAt: selection.dateRange?.from ? toUTCMidnight(selection.dateRange.from) : 0,
      endsAt: selection.dateRange?.to ? toUTCMidnight(selection.dateRange.to) : 0,
    }))

    execute({
      lineItems,
      mode: "payment",
      metadata: { ads: JSON.stringify(adData) },
      successUrl: "/advertise/success",
      cancelUrl: "/advertise",
    })
  }

  return (
    <div className={cx("flex flex-col w-full border divide-y rounded-md", className)} {...props}>
      <div className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth scrollbar-none">
        {spots.map(adSpot => (
          <AdsCalendar
            key={adSpot.type}
            adSpot={adSpot}
            ads={ads}
            price={price}
            selections={selections}
            updateSelection={updateSelection}
            className="group shrink-0 flex-1 min-w-76 snap-center border-l -ml-px"
          >
            {type === adSpot.type && (
              <div className="absolute inset-px -z-10 border-2 border-primary/50 rounded-sm" />
            )}
          </AdsCalendar>
        ))}
      </div>

      <AnimatedContainer height className="-mt-px">
        {hasSelections && (
          <div className="flex flex-col gap-3 text-sm text-muted-foreground p-4">
            {selections.map(selection => {
              if (!selection.dateRange?.from || !selection.dateRange?.to || !selection.duration) {
                return null
              }

              const adSpot = findAdSpot(selection.type)
              const from = startOfDay(selection.dateRange.from)
              const to = endOfDay(selection.dateRange.to)

              return (
                <div key={selection.type} className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <span className="flex items-center gap-2 mr-auto">
                    <Button
                      variant="secondary"
                      size="sm"
                      aria-label={t("clear_selection", { adSpot: adSpot.label })}
                      prefix={<XIcon />}
                      onClick={() => clearSelection(selection.type)}
                    />

                    <div>
                      <strong className="font-medium text-foreground">{adSpot.label}</strong> – (
                      {selection.duration} {t("day", { count: selection.duration })})
                    </div>
                  </span>

                  <span>{format.dateTimeRange(from, to, { dateStyle: "medium" })}</span>
                </div>
              )
            })}
          </div>
        )}
      </AnimatedContainer>

      <Stack className="text-center p-4 sm:justify-between sm:text-start">
        {price ? (
          <>
            <Stack size="sm" className="mr-auto">
              <Note>{t("total")}</Note>
              <Price
                price={price.discountedPrice}
                fullPrice={price.totalPrice}
                currency={siteConfig.currency}
              />
            </Stack>

            {price.discountPercentage > 0 && (
              <Tooltip tooltip={t("discount_tooltip", { discount: adsConfig.maxDiscount })}>
                <Badge
                  size="lg"
                  variant="outline"
                  className="-my-1.5 text-green-700/90 dark:text-green-300/90"
                >
                  {t("discount_label", { discount: price.discountPercentage })}
                </Badge>
              </Tooltip>
            )}
          </>
        ) : (
          <Note>{t("select_dates_error")}</Note>
        )}

        <Button
          variant="fancy"
          size="md"
          disabled={!hasSelections || isPending}
          isPending={isPending}
          className="max-sm:w-full sm:-my-2"
          onClick={handleCheckout}
        >
          {t("purchase_button")}
        </Button>
      </Stack>
    </div>
  )
}
