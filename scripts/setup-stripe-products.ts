import type { Stripe } from "stripe"
import { siteConfig } from "~/config/site"
import { stripe } from "~/services/stripe"

const products: (Stripe.ProductCreateParams & { price_data?: Stripe.PriceCreateParams[] })[] = [
  {
    name: "Free Listing",
    description: "Free listing with a wait time and a direct link to your website.",
    active: true,
    metadata: { tier: "Free" },
    marketing_features: [
      { name: "• Few weeks processing time" },
      { name: "✗ No content updates" },
      { name: "✗ No do-follow backlink" },
      { name: "✗ No featured spot" },
      { name: "✗ No prominent placement" },
    ],
    default_price_data: {
      unit_amount: 0,
      currency: siteConfig.currency,
    },
  },
  {
    name: "Standard Listing",
    description: "Upgrade your listing to skip the queue and get published within 24 hours.",
    active: true,
    metadata: { tier: "Standard" },
    marketing_features: [
      { name: "✓ 24h processing time" },
      { name: "✓ Unlimited content updates" },
      { name: "✓ Do-follow backlink" },
      { name: "✗ No featured spot" },
      { name: "✗ No prominent placement" },
    ],
    default_price_data: {
      unit_amount: 9700,
      currency: siteConfig.currency,
    },
  },
  {
    name: "Premium Listing",
    description: "Premium listing with a homepage spot and a prominent placement.",
    active: true,
    metadata: { tier: "Premium" },
    marketing_features: [
      { name: "✓ 12h processing time" },
      { name: "✓ Unlimited content updates" },
      { name: "✓ Do-follow backlink" },
      { name: "✓ Featured spot on homepage" },
      { name: "✓ Prominent placement" },
    ],
    default_price_data: {
      unit_amount: 19700,
      currency: siteConfig.currency,
      recurring: {
        interval: "month",
        interval_count: 1,
      },
    },
    price_data: [
      {
        unit_amount: 197000,
        currency: siteConfig.currency,
        recurring: {
          interval: "year",
          interval_count: 1,
        },
      },
    ],
  },
]

async function main() {
  try {
    if (!stripe) {
      console.error("Stripe is not configured. Set STRIPE_SECRET_KEY.")
      process.exit(1)
    }
    // Create products
    for (const { price_data, ...productData } of products) {
      const product = await stripe.products.create(productData)

      // Create prices
      if (price_data) {
        for (const priceData of price_data) {
          await stripe.prices.create({ ...priceData, product: product.id })
        }
      }
    }

    console.log("🎉 All products and prices replicated successfully!")
  } catch (error) {
    console.error("❌ Error replicating products:", error)
    process.exit(1)
  }
}

main().catch(console.error)
