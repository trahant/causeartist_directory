import { ORPCError } from "@orpc/server"
import { tryCatch } from "@primoui/utils"
import { siteConfig } from "~/config/site"
import { EmailContactFormInternal } from "~/emails/contact-form-internal"
import { env } from "~/env"
import { isEmailDeliveryConfigured, sendEmail } from "~/lib/email"
import { withRateLimit } from "~/lib/orpc"
import { contactFormSchema } from "~/server/web/contact/schema"
import { createResendContact } from "~/services/resend"

const submit = withRateLimit("contact")
  .input(contactFormSchema)
  .handler(async ({ input: { captcha, name, email, message, newsletterOptIn } }) => {
    if (captcha) {
      return { success: true as const }
    }

    if (!isEmailDeliveryConfigured()) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Email delivery is not configured. Please try again later.",
      })
    }

    const inbox = env.CONTACT_INBOX_EMAIL
    if (!inbox) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Contact form is not configured.",
      })
    }

    const subject = `[${siteConfig.name} Contact] ${name}`
    const sent = await sendEmail({
      to: inbox,
      replyTo: email,
      subject,
      react: EmailContactFormInternal({
        to: inbox,
        name,
        fromEmail: email,
        message,
      }),
    })

    if (!sent) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to send your message. Please try again later.",
      })
    }

    if (newsletterOptIn) {
      const [firstName, ...rest] = name.trim().split(/\s+/)
      const lastName = rest.join(" ") || undefined
      const { error: contactError } = await tryCatch(
        createResendContact({
          email,
          firstName,
          lastName,
        }),
      )
      if (contactError) {
        console.error("Contact form: newsletter signup failed:", contactError)
      }
    }

    return { success: true as const }
  })

export const contactRouter = {
  submit,
}
