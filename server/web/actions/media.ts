"use server"

import { tryCatch } from "@primoui/utils"
import { getTranslations } from "next-intl/server"
import wretch from "wretch"
import { getFaviconFetchUrl, getScreenshotFetchUrl, uploadToS3Storage } from "~/lib/media"
import { actionClient } from "~/lib/safe-actions"
import { createFetchMediaSchema, createUploadMediaSchema } from "~/server/web/shared/schema"

export const fetchMedia = actionClient
  .inputSchema(async () => {
    const t = await getTranslations("schema")
    return createFetchMediaSchema(t)
  })
  .action(async ({ parsedInput: { url, path, type } }) => {
    const endpoint = type === "favicon" ? getFaviconFetchUrl(url) : getScreenshotFetchUrl(url)
    const { data, error } = await tryCatch(wretch(endpoint).get().arrayBuffer().then(Buffer.from))

    if (error) {
      console.error("Failed to fetch media:", error)
      throw error
    }

    return await uploadToS3Storage(data, path)
  })

export async function uploadMedia(formData: FormData) {
  const t = await getTranslations("schema")
  const schema = createUploadMediaSchema(t)

  const { data, error } = schema.safeParse({
    path: formData.get("path"),
    file: formData.get("file"),
  })

  if (error) {
    return { error: error.issues[0]?.message }
  }

  const buffer = Buffer.from(await data.file.arrayBuffer())
  const url = await uploadToS3Storage(buffer, data.path)

  return { data: url }
}
