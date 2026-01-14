"use client"

import { useLocalStorage } from "@mantine/hooks"
import { ArrowUpRightIcon, TicketPercentIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import type { InferSafeActionFnInput } from "next-safe-action"
import { useAction } from "next-safe-action/hooks"
import type { ComponentProps, ReactNode } from "react"
import { toast } from "sonner"
import type Stripe from "stripe"
import { Badge } from "~/components/common/badge"
import { Button } from "~/components/common/button"
import { Card, CardBadges, CardBg } from "~/components/common/card"
import { H4 } from "~/components/common/heading"
import { Skeleton } from "~/components/common/skeleton"
import { Stack } from "~/components/common/stack"
import { Price } from "~/components/web/price"
import { ProductFeatures } from "~/components/web/products/product-features"
import { ProductIntervalSwitch } from "~/components/web/products/product-interval-switch"
import { siteConfig } from "~/config/site"
import { useProductPrices } from "~/hooks/use-product-prices"
import { getProductFeatures, type ProductInterval } from "~/lib/products"
import { cx } from "~/lib/utils"
import { createStripeCheckout } from "~/server/web/products/actions"

const productClassName = "items-stretch gap-8 basis-72 grow max-w-80 bg-transparent"

type ProductData = {
  product: Stripe.Product
  prices: Stripe.Price[]
  coupon?: Stripe.Coupon
}

type ProductCheckoutData = Omit<
  InferSafeActionFnInput<typeof createStripeCheckout>["parsedInput"],
  "lineItems" | "mode" | "coupon"
>

type ProductProps = ComponentProps<typeof Card> & {
  data: ProductData
  checkoutData: ProductCheckoutData
  isFeatured?: boolean
  buttonLabel?: ReactNode
}

const Product = ({
  className,
  data,
  checkoutData,
  isFeatured,
  buttonLabel,
  ...props
}: ProductProps) => {
  const { product, prices, coupon } = data
  const features = getProductFeatures(product)
  const t = useTranslations("components.product")

  const [interval, setInterval] = useLocalStorage<ProductInterval>({
    key: `${siteConfig.slug}-product-interval`,
    defaultValue: "month",
  })

  const { execute, isPending } = useAction(createStripeCheckout, {
    onError: ({ error }) => {
      console.error("Checkout error:", error)
      toast.error(error.serverError)
    },
  })

  const onSubmit = () => {
    if (currentPrice?.id) {
      execute({
        lineItems: [{ price: currentPrice.id }],
        mode: isSubscription ? "subscription" : "payment",
        coupon: coupon?.id,
        ...checkoutData,
      })
    }
  }

  const priceCalculations = useProductPrices(prices, coupon, interval)
  const { isSubscription, currentPrice, price, fullPrice, discount } = priceCalculations

  return (
    <Card
      hover={false}
      className={cx(productClassName, isFeatured && "not-only:lg:-my-3 lg:py-8", className)}
      {...props}
    >
      {isFeatured && <CardBg />}

      {coupon && (fullPrice || 0) > price && (
        <CardBadges size="sm">
          <Badge
            variant="success"
            prefix={<TicketPercentIcon />}
            className="border-background shadow-sm"
          >
            Limited offer
          </Badge>
        </CardBadges>
      )}

      <Stack size="lg" direction="column">
        <Stack className="w-full justify-between">
          <H4 className="flex-1 truncate">{product.name}</H4>

          {isSubscription && prices.length > 1 && (
            <ProductIntervalSwitch
              intervals={[
                { label: t("interval.monthly"), value: "month" },
                { label: t("interval.yearly"), value: "year" },
              ]}
              value={interval}
              onChange={setInterval}
            />
          )}
        </Stack>

        {product.description && (
          <p className="text-foreground/50 text-sm text-pretty">{product.description}</p>
        )}
      </Stack>

      <Price
        price={price}
        fullPrice={fullPrice}
        interval={t(`price_period.${isSubscription ? "month" : "one_time"}`)}
        discount={discount}
        coupon={coupon}
        format={{ style: "decimal", notation: "compact", maximumFractionDigits: 0 }}
        className="w-full"
        priceClassName="text-[3em]"
      />

      <ProductFeatures features={features} />

      <Button
        onClick={onSubmit}
        variant={isFeatured ? "primary" : "secondary"}
        disabled={isPending || !currentPrice?.unit_amount}
        isPending={isPending}
        suffix={!currentPrice?.unit_amount ? <span /> : <ArrowUpRightIcon />}
      >
        {buttonLabel}
      </Button>
    </Card>
  )
}

const ProductSkeleton = () => {
  return (
    <Card hover={false} className={productClassName}>
      <div className="space-y-3">
        <H4>
          <Skeleton className="w-24">&nbsp;</Skeleton>
        </H4>

        <div className="flex flex-col gap-2">
          <Skeleton className="w-full h-4">&nbsp;</Skeleton>
          <Skeleton className="w-3/4 h-4">&nbsp;</Skeleton>
        </div>
      </div>

      <Skeleton className="w-1/4 h-[0.75em] text-[3em]">&nbsp;</Skeleton>

      <ProductFeatures
        features={[...Array(5)].map((_, index) => ({
          name: <Skeleton style={{ width: `${[60, 40, 70, 45, 55][index]}%` }}>&nbsp;</Skeleton>,
          type: "negative",
        }))}
      />

      <Button variant="secondary" disabled>
        &nbsp;
      </Button>
    </Card>
  )
}

export { Product, ProductSkeleton }
