import { fetchAndUploadMedia, uploadToS3Storage } from "~/lib/media"
import { withAuth, withAuthRateLimit } from "~/lib/orpc"
import { fetchMediaSchema, uploadMediaSchema } from "~/server/web/media/schema"

const fetch = withAuth.input(fetchMediaSchema).handler(async ({ input: { url, path, type } }) => {
  return fetchAndUploadMedia(url, path, type)
})

const upload = withAuthRateLimit("media")
  .input(uploadMediaSchema)
  .handler(async ({ input: { path, base64 } }) => {
    const buffer = Buffer.from(base64, "base64")
    return uploadToS3Storage(buffer, path)
  })

export const mediaRouter = {
  fetch,
  upload,
}
