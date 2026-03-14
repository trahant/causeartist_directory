import { ORPCError } from "@orpc/server"
import { siteConfig } from "~/config/site"
import { withOptionalAuth } from "~/lib/orpc"
import { checkoutSchema } from "~/server/web/products/schema"
import { stripe } from "~/services/stripe"

const createCheckout = withOptionalAuth
  .input(checkoutSchema)
  .handler(
    async ({
      input: { lineItems, successUrl, cancelUrl, mode, metadata, coupon },
      context: { user },
    }) => {
      if (!stripe) throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Stripe is not configured." })
      const customerEmail = user?.email

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
    },
  )

export const productRouter = {
  createCheckout,
}
