import { DeleteObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3"
import { Upload } from "@aws-sdk/lib-storage"
import { getDomain, getErrorMessage, tryCatch } from "@primoui/utils"
import wretch from "wretch"
import { env, isProd } from "~/env"
import {
  extAndContentTypeFromValidatedMime,
  resolveFetchedImageBuffer,
} from "~/lib/image-upload-format"
import { isSupabaseStorageConfigured, uploadBytesToSupabase } from "~/lib/supabase-storage"
import { s3Client } from "~/services/s3"

const uploadToS3WithObjectKey = async (file: Buffer, objectKey: string, contentType: string) => {
  if (!s3Client || !env.S3_BUCKET) {
    throw new Error("S3 is not configured (need S3_BUCKET, region, and credentials)")
  }
  const endpoint = env.S3_PUBLIC_URL ?? `https://${env.S3_BUCKET}.s3.${env.S3_REGION}.amazonaws.com`

  const upload = new Upload({
    client: s3Client,
    params: {
      Bucket: env.S3_BUCKET,
      Key: objectKey,
      Body: file,
      ContentType: contentType,
      StorageClass: "STANDARD",
    },
    queueSize: 4,
    partSize: 1024 * 1024 * 5,
    leavePartsOnError: false,
  })

  const { data, error } = await tryCatch(upload.done())

  if (error) {
    throw new Error(`Failed to upload ${objectKey} to S3: ${getErrorMessage(error)}`)
  }

  if (!data.Key) {
    throw new Error(`Failed to upload ${objectKey} to S3`)
  }

  return `${endpoint}/${data.Key}?v=${Date.now()}`
}

/**
 * Upload public media: Supabase Storage when configured; otherwise optional S3 (legacy).
 * @param declaredMime optional client MIME (validated on RPC) when magic-byte sniff is inconclusive.
 */
export const uploadPublicMedia = async (file: Buffer, key: string, declaredMime?: string) => {
  const { ext, contentType } =
    declaredMime != null && declaredMime.length > 0
      ? extAndContentTypeFromValidatedMime(declaredMime)
      : await resolveFetchedImageBuffer(file)
  const objectKey = `${key}.${ext}`

  if (isSupabaseStorageConfigured()) {
    return uploadBytesToSupabase(file, objectKey, contentType)
  }
  if (s3Client && env.S3_BUCKET) {
    return uploadToS3WithObjectKey(file, objectKey, contentType)
  }
  throw new Error(
    "Supabase Storage is not configured. In .env.local set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (service_role from Dashboard → Settings → API), and SUPABASE_STORAGE_BUCKET, then restart. Leave S3_* empty. See .env.example.",
  )
}

/**
 * @deprecated Prefer uploadPublicMedia. Kept for direct S3 calls that pass key without extension.
 */
export const uploadToS3Storage = async (file: Buffer, key: string) => {
  const { ext, contentType } = await resolveFetchedImageBuffer(file)
  return uploadToS3WithObjectKey(file, `${key}.${ext}`, contentType)
}

/**
 * Removes a list of directories from S3.
 * @param directories - The directories to remove.
 */
export const removeS3Directories = async (directories: string[]) => {
  for (const directory of directories) {
    await removeS3Directory(directory)
  }
}

/**
 * Removes a directory from S3.
 * @param directory - The directory to remove.
 */
export const removeS3Directory = async (directory: string) => {
  if (!s3Client) return
  // Safety flag to prevent accidental deletion of S3 files
  if (!isProd) return

  const listCommand = new ListObjectsV2Command({
    Bucket: env.S3_BUCKET,
    Prefix: `${directory}/`,
  })

  let continuationToken: string | undefined

  do {
    const listResponse = await s3Client.send(listCommand)
    for (const object of listResponse.Contents || []) {
      if (object.Key) {
        await removeS3File(object.Key)
      }
    }
    continuationToken = listResponse.NextContinuationToken
    listCommand.input.ContinuationToken = continuationToken
  } while (continuationToken)
}

/**
 * Removes a file from S3.
 * @param key - The S3 key of the file to remove.
 */
export const removeS3File = async (key: string) => {
  if (!s3Client) return
  const deleteCommand = new DeleteObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: key,
  })

  return await s3Client.send(deleteCommand)
}

/**
 * Gets the URL of the favicon API endpoint.
 * @param url - The URL of the website to fetch the favicon from.
 * @returns The URL of the favicon API endpoint.
 */
export const getFaviconFetchUrl = (url: string) => {
  const options = new URLSearchParams({
    domain_url: getDomain(url),
    sz: "128",
  })

  return `https://www.google.com/s2/favicons?${options.toString()}`
}

/**
 * Gets the URL of the screenshot API endpoint.
 * @param url - The URL of the website to fetch the screenshot from.
 * @returns The URL of the screenshot API endpoint.
 */
export const getScreenshotFetchUrl = (url: string) => {
  const params = new URLSearchParams({
    url,
    access_key: env.SCREENSHOTONE_ACCESS_KEY ?? "",
    cache: "true",

    // Blockers
    delay: "1",
    block_ads: "true",
    block_chats: "true",
    block_trackers: "true",
    block_cookie_banners: "true",

    // Image and viewport options
    format: "webp",
    viewport_width: "1280",
    viewport_height: "720",
    image_quality: "90",
  })

  return `https://api.screenshotone.com/take?${params.toString()}`
}

/**
 * Fetches media (favicon or screenshot) from a URL and uploads it to S3.
 * @param url - The website URL to fetch media from.
 * @param path - The S3 key path (without extension).
 * @param type - The type of media to fetch ("favicon" or "screenshot").
 * @returns The S3 URL of the uploaded file, or null on failure.
 */
export const fetchAndUploadMedia = async (
  url: string,
  path: string,
  type: "favicon" | "screenshot",
) => {
  const endpoint = type === "favicon" ? getFaviconFetchUrl(url) : getScreenshotFetchUrl(url)
  const { data, error } = await tryCatch(wretch(endpoint).get().arrayBuffer().then(Buffer.from))

  if (error) {
    throw new Error(`Failed to fetch ${type} from ${url}: ${getErrorMessage(error)}`)
  }

  return uploadPublicMedia(data, path)
}
