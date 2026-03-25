"use client"

import { useCallback, useRef, useState } from "react"
import { toast } from "sonner"
import { fileToBase64 } from "~/lib/file-to-base64"
import { client } from "~/lib/orpc-client"

type UploadedFile = {
  key: string
  url: string
  name: string
  size: number
  type: string
}

type UseMediaUploadOptions = {
  /** When set, object key is `${keyPrefix}/${uniqueId}` (no `/content/` segment). For hero images: `companies/{id}/hero`. */
  keyPrefix?: string
}

export const useMediaUpload = (mediaPath: string, options?: UseMediaUploadOptions) => {
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null)
  const [uploadingFile, setUploadingFile] = useState<File | null>(null)
  const activeUploads = useRef(new Set<string>())

  const uploadFile = useCallback(
    async (file: File, onUploadComplete?: (file: UploadedFile) => void) => {
      const uniqueId = crypto.randomUUID().slice(0, 8)
      const s3Key = options?.keyPrefix
        ? `${options.keyPrefix}/${uniqueId}`
        : `${mediaPath}/content/${uniqueId}`

      // Prevent duplicate uploads
      if (activeUploads.current.has(s3Key)) return
      activeUploads.current.add(s3Key)

      setIsUploading(true)
      setUploadingFile(file)
      setError(null)

      try {
        const base64 = await fileToBase64(file)
        const mimeType =
          file.type ||
          (() => {
            const ext = file.name.split(".").pop()?.toLowerCase()
            if (ext === "jpg" || ext === "jpeg") return "image/jpeg"
            if (ext === "png") return "image/png"
            if (ext === "webp") return "image/webp"
            if (ext === "avif") return "image/avif"
            return ""
          })()
        if (!mimeType) {
          throw new Error("Could not determine image type (add a file extension or use JPEG/PNG/WebP/AVIF)")
        }
        const url = await client.web.media.upload({ path: s3Key, base64, mimeType })

        setProgress(100)

        if (!url) throw new Error("Upload failed: no URL returned")

        const uploaded: UploadedFile = {
          key: s3Key,
          url,
          name: file.name,
          size: file.size,
          type: file.type,
        }

        setUploadedFile(uploaded)
        onUploadComplete?.(uploaded)

        return uploaded
      } catch (err) {
        const message = err instanceof Error ? err.message : "Upload failed"
        setError(message)
        toast.error(message)
      } finally {
        activeUploads.current.delete(s3Key)
        setIsUploading(false)
        setUploadingFile(null)
        setProgress(0)
      }
    },
    [mediaPath, options?.keyPrefix],
  )

  return { isUploading, progress, uploadFile, uploadedFile, uploadingFile, error }
}
