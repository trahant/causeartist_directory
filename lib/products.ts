import { addDays, differenceInMonths } from "date-fns"
import plur from "plur"
import type { ReactNode } from "react"
import type Stripe from "stripe"
import { submissionsConfig } from "~/config/submissions"
import {
  findStripeCoupon,
  findStripePricesByProduct,
  findStripeProducts,
} from "~/server/web/products/queries"

const SYMBOLS = {
  positive: "✓ ",
  neutral: "• ",
  negative: "✗ ",
} as const

type SymbolType = keyof typeof SYMBOLS

export type ProductInterval = "month" | "year"

export type ProductFeature = {
  name: ReactNode
  footnote?: ReactNode
  type?: keyof typeof SYMBOLS
}

export type ProductWithPrices = {
  product: Stripe.Product
  prices: Stripe.Price[]
  coupon: Stripe.Coupon | undefined
}

export type ProductProps = {
  product?: Partial<Stripe.Product>
  isDisabled?: boolean
  buttonLabel?: ReactNode
} | null

export const calculateQueueDuration = (queueSize: number) => {
  const queueDays = Math.ceil((queueSize / submissionsConfig.postingRate) * 7)
  const queueMonths = Math.max(differenceInMonths(addDays(new Date(), queueDays), new Date()), 1)

  return `${queueMonths} ${plur("month", queueMonths)}`
}

const extractFeatureTypeFromName = (featureName?: string) => {
  return Object.keys(SYMBOLS).find(key => featureName?.startsWith(SYMBOLS[key as SymbolType])) as
    | SymbolType
    | undefined
}

const removeTypeSymbolFromName = (name: string, type?: SymbolType) => {
  return type ? name.replace(SYMBOLS[type], "") : name
}

/**
 * Get the price amount from a Stripe price object or string.
 *
 * @param price - The price to get the amount from.
 * @returns The price amount.
 */
const extractPriceAmount = (price?: Stripe.Price | string | null) => {
  return typeof price === "object" && price !== null ? (price.unit_amount ?? 0) : 0
}

/*
 * Sort products by price
 */
export const sortProductsByPrice = (products: Stripe.Product[]) => {
  return products.sort(
    (a, b) => extractPriceAmount(a.default_price) - extractPriceAmount(b.default_price),
  )
}

/**
 * Check if a product is eligible for a discount with the given coupon.
 */
const isProductEligibleForDiscount = (productId: string, coupon?: Stripe.Coupon) => {
  return !coupon?.applies_to || coupon.applies_to.products.includes(productId)
}

/**
 * Get the normalized features of a product.
 *
 * @param product - The product to get the features of.
 * @returns The normalized features of the product.
 */
export const getProductFeatures = (product: Stripe.Product) => {
  return product.marketing_features.map(feature => {
    const type = extractFeatureTypeFromName(feature.name)
    const name = removeTypeSymbolFromName(feature.name || "", type)

    return { name, type } satisfies ProductFeature
  })
}

/**
 * Fetch prices for a list of products and prepare them for display.
 */
export const getProductsWithPrices = async (
  products: Stripe.Product[],
  coupon?: Stripe.Coupon,
): Promise<ProductWithPrices[]> => {
  return Promise.all(
    products.map(async product => {
      const prices = await findStripePricesByProduct(product.id)
      const isEligibleForDiscount = isProductEligibleForDiscount(product.id, coupon)

      return {
        product,
        prices,
        coupon: isEligibleForDiscount ? coupon : undefined,
      }
    }),
  )
}

/**
 * Get the products for a listing.
 *
 * @param discountCode - The discount code to apply to the products.
 * @returns A promise that resolves to an array of products with their prices and discount status.
 */
export const getProductsForListing = async (discountCode?: string) => {
  const [products, coupon] = await Promise.all([
    findStripeProducts(),
    findStripeCoupon(discountCode),
  ])

  return getProductsWithPrices(sortProductsByPrice(products), coupon)
}
