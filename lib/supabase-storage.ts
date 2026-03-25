import { createClient } from "@supabase/supabase-js"
import { env } from "~/env"

/** Project URL: explicit `SUPABASE_URL` or the same value exposed to the client as `NEXT_PUBLIC_SUPABASE_URL`. */
export const supabaseProjectUrl = (): string | undefined =>
  env.SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL

export const isSupabaseStorageConfigured = () =>
  Boolean(supabaseProjectUrl() && env.SUPABASE_SERVICE_ROLE_KEY && env.SUPABASE_STORAGE_BUCKET)

/** Names of Supabase Storage env vars that are unset or empty (empty strings become undefined in `~/env`). */
export const missingSupabaseStorageEnvVars = (): string[] => {
  const missing: string[] = []
  if (!supabaseProjectUrl()) {
    missing.push("SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL")
  }
  if (!env.SUPABASE_SERVICE_ROLE_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY")
  if (!env.SUPABASE_STORAGE_BUCKET) missing.push("SUPABASE_STORAGE_BUCKET")
  return missing
}

/**
 * Upload bytes to a public bucket. `objectPath` must include file extension (e.g. `dir/file.jpg`).
 */
export const uploadBytesToSupabase = async (
  file: Buffer,
  objectPath: string,
  contentType: string,
) => {
  if (!isSupabaseStorageConfigured()) {
    const missing = missingSupabaseStorageEnvVars()
    throw new Error(
      missing.length > 0
        ? `Supabase Storage is not configured (missing: ${missing.join(", ")}). Set them in .env.local and restart the dev server.`
        : "Supabase Storage is not configured",
    )
  }

  const supabase = createClient(supabaseProjectUrl()!, env.SUPABASE_SERVICE_ROLE_KEY!, {
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
