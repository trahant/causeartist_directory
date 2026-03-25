import { ORPCError } from "@orpc/server"
import { fetchAndUploadMedia, uploadPublicMedia } from "~/lib/media"
import { withAuth, withAuthRateLimit } from "~/lib/orpc"
import { fetchMediaSchema, uploadMediaSchema } from "~/server/web/media/schema"

const fetch = withAuth.input(fetchMediaSchema).handler(async ({ input: { url, path, type } }) => {
  return fetchAndUploadMedia(url, path, type)
})

const upload = withAuthRateLimit("media")
  .input(uploadMediaSchema)
  .handler(async ({ input: { path, base64, mimeType } }) => {
    try {
      const buffer = Buffer.from(base64, "base64")
      return await uploadPublicMedia(buffer, path, mimeType)
    } catch (e) {
      const message = e instanceof Error ? e.message : "Upload failed"
      const code =
        message.includes("Supabase Storage is not configured") ||
        message.includes("S3 is not configured") ||
        message.includes("Unsupported image MIME")
          ? ("BAD_REQUEST" as const)
          : ("INTERNAL_SERVER_ERROR" as const)
      throw new ORPCError(code, { message })
    }
  })

export const mediaRouter = {
  fetch,
  upload,
}
