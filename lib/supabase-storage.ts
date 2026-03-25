import { createClient } from "@supabase/supabase-js"
import { env } from "~/env"

export const isSupabaseStorageConfigured = () =>
  Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY && env.SUPABASE_STORAGE_BUCKET)

/**
 * Upload bytes to a public bucket. `objectPath` must include file extension (e.g. `dir/file.jpg`).
 */
export const uploadBytesToSupabase = async (
  file: Buffer,
  objectPath: string,
  contentType: string,
) => {
  if (!isSupabaseStorageConfigured()) {
    throw new Error("Supabase Storage is not configured")
  }

  const supabase = createClient(env.SUPABASE_URL!, env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const bucket = env.SUPABASE_STORAGE_BUCKET!

  const body = new Uint8Array(file.buffer, file.byteOffset, file.byteLength)

  const { error } = await supabase.storage.from(bucket).upload(objectPath, body, {
    contentType,
    upsert: true,
  })

  if (error) {
    throw new Error(`Failed to upload to Supabase Storage: ${error.message}`)
  }

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(objectPath)
  const publicUrl = urlData.publicUrl

  if (env.SUPABASE_STORAGE_PUBLIC_URL) {
    const base = env.SUPABASE_STORAGE_PUBLIC_URL.replace(/\/$/, "")
    if (base.includes("/storage/v1/object/public/")) {
      return `${base}/${objectPath}`
    }
  }

  return publicUrl
}
