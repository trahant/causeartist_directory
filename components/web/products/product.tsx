"use client"

import { useLocalStorage } from "@mantine/hooks"
import { useMutation } from "@tanstack/react-query"
import { ArrowUpRightIcon, TicketPercentIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import type { ComponentProps, ReactNode } from "react"
import { toast } from "sonner"
import type Stripe from "stripe"
import type { z } from "zod"
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
import { orpc } from "~/lib/orpc-query"
import { getProductFeatures, type ProductInterval } from "~/lib/products"
import { cx } from "~/lib/utils"
import type { checkoutSchema } from "~/server/web/products/schema"

const productClassName = "items-stretch gap-8 basis-72 grow max-w-80 bg-transparent"

type ProductData = {
  product: Stripe.Product
  prices: Stripe.Price[]
  coupon?: Stripe.Coupon
}

type ProductCheckoutData = Omit<z.infer<typeof checkoutSchema>, "lineItems" | "mode" | "coupon">

type ProductProps = ComponentProps<typeof Card> & {
  data: ProductData
  checkoutData: ProductCheckoutData
  isHighlighted?: boolean
  isDisabled?: boolean
  buttonLabel?: ReactNode
}

const Product = ({
  className,
  data,
  checkoutData,
  isHighlighted,
  isDisabled,
  buttonLabel,
  ...props
}: ProductProps) => {
  const { product, prices, coupon } = data
  const router = useRouter()
  const features = getProductFeatures(product)
  const t = useTranslations("components.product")

  const [interval, setInterval] = useLocalStorage<ProductInterval>({
    key: `${siteConfig.slug}-product-interval`,
    defaultValue: "month",
  })

  const { mutate, isPending } = useMutation(
    orpc.web.products.createCheckout.mutationOptions({
      onSuccess: data => {
        window.location.href = data.url
      },
      onError: error => {
        toast.error(error.message)
      },
    }),
  )

  const onSubmit = () => {
    if (currentPrice?.id && currentPrice.unit_amount) {
      return mutate({
        lineItems: [{ price: currentPrice.id }],
        mode: isSubscription ? "subscription" : "payment",
        coupon: coupon?.id,
        ...checkoutData,
      })
    }

    return router.push(checkoutData.successUrl)
  }

  const priceCalculations = useProductPrices(prices, coupon, interval)
  const { isSubscription, currentPrice, price, fullPrice, discount, currency } = priceCalculations

  return (
    <Card
      hover={false}
      className={cx(
        productClassName,
        isHighlighted && "not-only:lg:-my-3 lg:py-8",
        isDisabled && "opacity-50 cursor-not-allowed",
        className,
      )}
      {...props}
    >
      {isHighlighted && <CardBg />}

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
        currency={currency}
        format={{ style: "decimal", notation: "compact", maximumFractionDigits: 0 }}
        className="w-full"
        priceClassName="text-[3em]"
      />

      <ProductFeatures features={features} />

      <Button
        type="button"
        onClick={onSubmit}
        variant={isHighlighted ? "primary" : "secondary"}
        isPending={isPending}
        disabled={isPending || isDisabled}
        suffix={<ArrowUpRightIcon />}
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
