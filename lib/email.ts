import type { WithRequired } from "@primoui/utils"
import { render } from "@react-email/components"
import type { CreateEmailOptions, CreateEmailResponseSuccess } from "resend"
import { siteConfig } from "~/config/site"
import { env, isDev } from "~/env"
import { resend } from "~/services/resend"

/**
 * Email parameters for sending emails via Resend.
 * `react` and `subject` are required, `from` and `text` are automatically set.
 */
export type EmailParams = WithRequired<
  Omit<CreateEmailOptions, "from" | "text" | "template">,
  "subject"
>

export const isEmailDeliveryConfigured = (): boolean =>
  Boolean(resend && env.RESEND_SENDER_EMAIL)

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
 * Sends an email via Resend when `RESEND_API_KEY` and `RESEND_SENDER_EMAIL` are set.
 * Sends in **all** environments (including local dev) so magic links and notifications work.
 *
 * @returns Resend success payload, or `undefined` if not configured or send failed
 */
export const sendEmail = async (
  email: EmailParams,
): Promise<CreateEmailResponseSuccess | undefined> => {
  if (!isEmailDeliveryConfigured()) {
    if (isDev) {
      console.warn(
        "[email] Not sent — add RESEND_API_KEY and RESEND_SENDER_EMAIL to .env.local (see .env.example).",
        email.subject,
        "→",
        email.to,
      )
    }
    return undefined
  }

  const payload = await prepareEmail(email)
  const result = await resend!.emails.send(payload)

  if (result.error) {
    console.error("[email] Resend error:", result.error.message, result.error)
    return undefined
  }

  if (isDev) {
    console.info("[email] Sent:", payload.subject, "→", payload.to)
  }

  return result.data ?? undefined
}
