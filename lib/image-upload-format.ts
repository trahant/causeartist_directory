import { fileTypeFromBuffer } from "file-type/core"

const DECLARED: Record<string, { ext: string; contentType: string }> = {
  "image/jpeg": { ext: "jpg", contentType: "image/jpeg" },
  "image/jpg": { ext: "jpg", contentType: "image/jpeg" },
  "image/png": { ext: "png", contentType: "image/png" },
  "image/webp": { ext: "webp", contentType: "image/webp" },
  "image/avif": { ext: "avif", contentType: "image/avif" },
}

/** For RPC uploads: MIME was already validated by Zod — no `file-type/node` (breaks in Next API bundles). */
export function extAndContentTypeFromValidatedMime(mimeType: string) {
  const m = mimeType.toLowerCase().split(";")[0]!.trim()
  const r = DECLARED[m]
  if (!r) {
    throw new Error(`Unsupported image MIME: ${m}`)
  }
  return r
}

/** For server-fetched bytes (favicon/screenshot): use bundler-safe `file-type/core` only. */
export async function resolveFetchedImageBuffer(buffer: Buffer) {
  if (buffer.length === 0) {
    return { ext: "png", contentType: "image/png" }
  }
  try {
    const s = await fileTypeFromBuffer(buffer)
    if (s?.mime?.startsWith("image/")) {
      return { ext: s.ext, contentType: s.mime }
    }
  } catch {
    /* ignore */
  }
  return { ext: "png", contentType: "image/png" }
}
