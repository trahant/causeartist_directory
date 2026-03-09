import { useMutation } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import type { ChangeEvent } from "react"
import type { FieldPath, FieldValues, Path, PathValue, UseFormReturn } from "react-hook-form"
import { toast } from "sonner"
import { webOrpc } from "~/lib/orpc-query"
import { createFileSchema } from "~/server/web/shared/schema"

type MediaActionConfig<T extends FieldValues> = {
  form: UseFormReturn<T>
  path: string
  fieldName: FieldPath<T>
  fetchType?: "favicon" | "screenshot"
  successMessage?: string
  errorMessage?: string
}

export const useMediaAction = <T extends FieldValues>({
  form,
  path,
  fieldName,
  fetchType,
  successMessage = "Media successfully uploaded. Please save to update.",
  errorMessage = "Failed to upload media. Please try again.",
}: MediaActionConfig<T>) => {
  const t = useTranslations("schema")
  const fileSchema = createFileSchema(t)

  const fetchMutation = useMutation(
    webOrpc.media.fetch.mutationOptions({
      onSuccess: data => {
        toast.success(successMessage)
        form.setValue(fieldName, data as PathValue<T, Path<T>>)
      },

      onError: error => {
        toast.error(error.message)
      },
    }),
  )

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append("path", path)
      formData.append("file", file)

      const response = await globalThis.fetch("/api/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      })

      const result = await response.json()

      if (!response.ok || result.error) {
        throw new Error(result.error ?? errorMessage)
      }

      return result.data as string
    },

    onSuccess: data => {
      form.resetField(fieldName)
      form.setValue(fieldName, data as PathValue<T, Path<T>>)
      toast.success(successMessage)
    },

    onError: error => {
      form.setError(fieldName, { message: error.message })
    },
  })

  const handleFetch = (url: string) => {
    fetchMutation.mutate({ url, type: fetchType, path })
  }

  const handleUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]

    const { data, error } = await fileSchema.safeParseAsync(file)

    if (error) {
      const message = error.issues[0]?.message ?? errorMessage
      form.setError(fieldName, { message })
      return
    }

    form.clearErrors(fieldName)
    uploadMutation.mutate(data)
  }

  return {
    handleUpload,
    handleFetch,
    isUploading: uploadMutation.isPending,
    isFetching: fetchMutation.isPending,
  }
}
