import type { WithRequired } from "@primoui/utils"
import { render } from "@react-email/components"
import type { CreateEmailOptions, CreateEmailResponse } from "resend"
import { siteConfig } from "~/config/site"
import { env, isProd } from "~/env"
import { resend } from "~/services/resend"

/**
 * Email parameters for sending emails via Resend.
 * `react` and `subject` are required, `from` and `text` are automatically set.
 */
export type EmailParams = WithRequired<
  Omit<CreateEmailOptions, "from" | "text" | "template">,
  "subject"
>

/**
 * Prepares an email for sending by adding defaults
 * @param email - The email to prepare
 * @returns The prepared email with `from` and `text` fields
 */
const prepareEmail = async (email: EmailParams): Promise<CreateEmailOptions> => {
  return {
    ...email,
    from: `${siteConfig.name} <${env.RESEND_SENDER_EMAIL}>`,
    replyTo: email.replyTo ?? siteConfig.email,
    text: await render(email.react, { plainText: true }),
  }
}

/**
 * Sends an email to the given recipient using Resend
 * @param email - The email to send
 * @returns The response from Resend, or undefined in development
 */
export const sendEmail = async (email: EmailParams): Promise<CreateEmailResponse | undefined> => {
  if (!resend) return
  const payload = await prepareEmail(email)

  if (!isProd) {
    console.log("Email payload:", payload)
    return
  }

  return resend.emails.send(payload)
}
