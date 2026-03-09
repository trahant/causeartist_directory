import { z } from "zod"
import { fetchAndUploadMedia } from "~/lib/media"
import { baseProcedure } from "~/lib/orpc"

const fetch = baseProcedure
  .input(
    z.object({
      url: z.url({ protocol: /^https?$/, normalize: true }),
      path: z.string().regex(/^[a-z0-9/_-]+$/i),
      type: z.enum(["favicon", "screenshot"]).default("favicon"),
    }),
  )
  .handler(async ({ input: { url, path, type } }) => {
    return fetchAndUploadMedia(url, path, type)
  })

export const mediaRouter = {
  fetch,
}
