import { revalidateTag } from "next/cache"
import { after } from "next/server"
import type Stripe from "stripe"
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
    if (!signature || !webhookSecret) {
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
        const { mode, subscription, metadata } = event.data.object

        switch (mode) {
          case "payment": {
            // Handle tool expedited payment
            if (metadata?.tool) {
              const tool = await db.tool.findUniqueOrThrow({
                where: { slug: metadata.tool },
              })

              // Notify the submitter of the premium tool
              after(async () => await notifySubmitterOfPremiumTool(tool))

              // Notify the admin of the premium tool
              after(async () => await notifyAdminOfPremiumTool(tool))
            }

            break
          }

          case "subscription": {
            const { metadata } = await stripe.subscriptions.retrieve(subscription as string)

            // Handle tool featured listing
            if (metadata?.tool) {
              const tool = await db.tool.update({
                where: { slug: metadata.tool },
                data: { isFeatured: true },
              })

              // Revalidate the cache
              revalidateTag("tools", "infinite")

              // Notify the submitter of the premium tool
              after(async () => await notifySubmitterOfPremiumTool(tool))

              // Notify the admin of the premium tool
              after(async () => await notifyAdminOfPremiumTool(tool))
            }

            break
          }
        }

        // Revalidate coupon in case it was used
        revalidateTag("stripe-coupon", "infinite")

        break
      }

      case "customer.subscription.deleted": {
        const { metadata } = event.data.object

        // Handle tool featured listing
        if (metadata?.tool) {
          await db.tool.update({
            where: { slug: metadata?.tool },
            data: { isFeatured: false },
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
