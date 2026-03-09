import { ORPCError } from "@orpc/server"
import { siteConfig } from "~/config/site"
import { getServerSession } from "~/lib/auth"
import { baseProcedure } from "~/lib/orpc"
import { checkoutSchema } from "~/server/web/products/schema"
import { stripe } from "~/services/stripe"

const createCheckout = baseProcedure
  .input(checkoutSchema)
  .handler(async ({ input: { lineItems, successUrl, cancelUrl, mode, metadata, coupon } }) => {
    const session = await getServerSession()
    const customerEmail = session?.user.email

    const checkout = await stripe.checkout.sessions.create({
      mode,
      metadata,
      line_items: lineItems,
      automatic_tax: { enabled: true },
      tax_id_collection: { enabled: true },
      customer_creation: mode === "payment" ? "if_required" : undefined,
      invoice_creation: mode === "payment" ? { enabled: true } : undefined,
      subscription_data: mode === "subscription" && metadata ? { metadata } : undefined,
      allow_promotion_codes: coupon ? undefined : true,
      discounts: coupon ? [{ coupon }] : undefined,
      success_url: `${siteConfig.url}${successUrl}?sessionId={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl ? `${siteConfig.url}${cancelUrl}?cancelled=true` : undefined,
      customer_email: customerEmail,
    })

    if (!checkout.url) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Unable to create a new Stripe Checkout Session.",
      })
    }

    return { url: checkout.url }
  })

export const webProductRouter = {
  createCheckout,
}
