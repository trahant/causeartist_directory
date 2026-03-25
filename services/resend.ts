import { type CreateContactOptions, Resend } from "resend"
import { env } from "~/env"

export const resend: Resend | null = env.RESEND_API_KEY
  ? new Resend(env.RESEND_API_KEY)
  : null

export const createResendContact = async (payload: CreateContactOptions) => {
  if (!resend) {
    throw new Error("Newsletter signup is temporarily unavailable.")
  }

  const segmentId = env.RESEND_NEWSLETTER_SEGMENT_ID
  const options: CreateContactOptions = {
    ...payload,
    ...(segmentId ? { segments: [{ id: segmentId }] } : {}),
  }

  const { error, data } = await resend.contacts.create(options)

  if (error) {
    throw new Error("Failed to create resend contact. Please try again later.")
  }

  return data?.id
}
