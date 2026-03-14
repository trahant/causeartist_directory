import { revalidateTag } from "next/cache"
import { after } from "next/server"
import type Stripe from "stripe"
import { ToolTier } from "~/.generated/prisma/client"
import { env } from "~/env"
import { notifyAdminOfPremiumTool, notifySubmitterOfPremiumTool } from "~/lib/notifications"
import { db } from "~/services/db"
import { stripe } from "~/services/stripe"

export async function POST(req: Request) {
  const body = await req.text()
  const signature = req.headers.get("stripe-signature") as string
  const webhookSecret = env.STRIPE_WEBHOOK_SECRET
  let event: Stripe.Event

  try {
    if (!stripe || !signature || !webhookSecret) {
      return new Response("Webhook secret not found.", { status: 400 })
    }

    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err: any) {
    console.log(`❌ Error message: ${err.message}`)
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object
        const slug = session.metadata?.tool
        const { email } = session.customer_details ?? {}

        // Ignore incorrect metadata
        if (!slug) {
          break
        }

        // Retrieve the session with line items expanded to get product metadata
        const checkoutSession = await stripe.checkout.sessions.retrieve(session.id, {
          expand: ["line_items.data.price.product"],
        })

        // Get the tier from the product metadata
        const lineItem = checkoutSession.line_items?.data[0]?.price?.product as
          | Stripe.Product
          | undefined
        const tier = lineItem?.metadata?.tier as ToolTier

        // Ignore free tiers
        if (!tier || tier === ToolTier.Free) {
          break
        }

        // Fetch existing tool to preserve current submitter fields
        const existingTool = await db.tool.findUnique({ where: { slug } })

        if (!existingTool) {
          break
        }

        // Update tier and populate submitter fields from Stripe customer
        const tool = await db.tool.update({
          where: { slug },
          data: {
            tier,
            submitterEmail: email ?? existingTool.submitterEmail,
            submitterName: session.customer_details?.name ?? existingTool.submitterName,
          },
        })

        // If the tool doesn't have an owner, try to match by customer email
        if (!tool.ownerId && email) {
          const user = await db.user.findUnique({ where: { email } })

          if (user) {
            await db.tool.update({
              where: { slug },
              data: { ownerId: user.id },
            })
          }
        }

        // Revalidate the tools cache
        revalidateTag("tools", "infinite")

        // Revalidate coupon in case it was used
        revalidateTag("stripe-coupon", "infinite")

        // Notify the submitter of the premium tool
        after(async () => await notifySubmitterOfPremiumTool(tool))

        // Notify the admin of the premium tool
        after(async () => await notifyAdminOfPremiumTool(tool))

        break
      }

      case "customer.subscription.deleted": {
        const { metadata } = event.data.object

        // Handle tool premium listing cancellation - downgrade to Standard (not Free)
        if (metadata?.tool) {
          await db.tool.update({
            where: { slug: metadata?.tool },
            data: { tier: ToolTier.Standard },
          })

          // Revalidate the cache
          revalidateTag("tools", "infinite")
        }

        break
      }
    }
  } catch (error) {
    console.log(error)

    return new Response(`Webhook handler failed: ${error}`, { status: 400 })
  }

  return new Response(JSON.stringify({ received: true }))
}
