"use client"

import { useCallback, useRef, useState } from "react"
import { toast } from "sonner"

type UploadedFile = {
  key: string
  url: string
  name: string
  size: number
  type: string
}

export const useMediaUpload = (mediaPath: string) => {
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null)
  const [uploadingFile, setUploadingFile] = useState<File | null>(null)
  const activeUploads = useRef(new Set<string>())

  const uploadFile = useCallback(
    async (file: File, onUploadComplete?: (file: UploadedFile) => void) => {
      const uniqueId = crypto.randomUUID().slice(0, 8)
      const s3Key = `${mediaPath}/content/${uniqueId}`

      // Prevent duplicate uploads
      if (activeUploads.current.has(s3Key)) return
      activeUploads.current.add(s3Key)

      setIsUploading(true)
      setUploadingFile(file)
      setError(null)

      try {
        const formData = new FormData()
        formData.append("path", s3Key)
        formData.append("file", file)

        const response = await globalThis.fetch("/api/upload", {
          method: "POST",
          body: formData,
          credentials: "include",
        })

        const result = await response.json()

        if (!response.ok || result.error) {
          throw new Error(result.error ?? "Upload failed")
        }

        setProgress(100)

        if (!result.data) throw new Error("Upload failed: no URL returned")
        const url = result.data as string

        const uploaded: UploadedFile = {
          key: s3Key,
          url: url,
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
    [mediaPath],
  )

  return { isUploading, progress, uploadFile, uploadedFile, uploadingFile, error }
}
