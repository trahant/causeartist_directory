"use server"

import { cacheLife, cacheTag } from "next/cache"
import { stripe } from "~/services/stripe"

export const findStripeProducts = async () => {
  "use cache"

  cacheTag("stripe-products")
  cacheLife("hours")

  try {
    const { data: products } = await stripe.products.list({
      active: true,
      limit: 100,
      expand: ["data.default_price"],
    })

    return products
  } catch (error) {
    console.error("Failed to fetch Stripe products:", error)
    throw new Error("Unable to load products. Please try again later.")
  }
}

export const findStripePricesByProduct = async (productId: string) => {
  "use cache"

  cacheTag(`stripe-prices-${productId}`)
  cacheTag("stripe-prices")
  cacheLife("days")

  try {
    const { data: prices } = await stripe.prices.list({
      product: productId,
      active: true,
      limit: 100,
    })

    return prices
  } catch (error) {
    console.error(`Failed to fetch prices for product ${productId}:`, error)
    throw new Error("Unable to load pricing information. Please try again later.")
  }
}

export const findStripeCoupon = async (code?: string) => {
  "use cache"

  cacheTag(`stripe-coupon-${code}`)
  cacheTag("stripe-coupon")
  cacheLife("days")

  if (!code?.trim()) return undefined

  try {
    const promoCodes = await stripe.promotionCodes.list({
      code,
      limit: 1,
      active: true,
      expand: ["data.promotion.coupon.applies_to"],
    })

    const coupon = promoCodes.data[0]?.promotion?.coupon
    return typeof coupon === "object" && coupon !== null ? coupon : undefined
  } catch (error) {
    console.error(`Failed to fetch coupon ${code}:`, error)
    // For coupons, we return undefined instead of throwing to allow graceful degradation
    return undefined
  }
}
