import { type CreateContactOptions, Resend } from "resend"
import { env } from "~/env"

export const resend: Resend | null = env.RESEND_API_KEY
  ? new Resend(env.RESEND_API_KEY)
  : null

export const createResendContact = async (payload: CreateContactOptions) => {
  if (!resend) return undefined
  const { error, data } = await resend.contacts.create(payload)

  if (error) {
    throw new Error("Failed to create resend contact. Please try again later.")
  }

  return data?.id
}
