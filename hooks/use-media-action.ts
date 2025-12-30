import { useTranslations } from "next-intl"
import { useAction } from "next-safe-action/hooks"
import { type ChangeEvent, useTransition } from "react"
import type { FieldPath, FieldValues, Path, PathValue, UseFormReturn } from "react-hook-form"
import { toast } from "sonner"
import { fetchMedia, uploadMedia } from "~/server/web/actions/media"
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
  const [isUploading, startUpload] = useTransition()
  const t = useTranslations("schema")
  const fileSchema = createFileSchema(t)

  const fetch = useAction(fetchMedia, {
    onSuccess: ({ data }) => {
      toast.success(successMessage)
      form.setValue(fieldName, data as PathValue<T, Path<T>>)
    },

    onError: ({ error: { serverError } }) => {
      serverError && toast.error(serverError)
    },
  })

  const handleFetch = async (url: string) => {
    fetch.execute({ url, type: fetchType, path })
  }

  const handleUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]

    startUpload(async () => {
      const { data, error } = await fileSchema.safeParseAsync(file)

      if (error) {
        const message = error.issues[0]?.message ?? errorMessage
        form.setError(fieldName, { message })
        return
      }

      form.clearErrors(fieldName)

      const formData = new FormData()
      formData.append("path", path)
      formData.append("file", data)

      const response = await uploadMedia(formData)

      if (response.error) {
        form.setError(fieldName, { message: response.error })
        return
      }

      if (response.data) {
        form.resetField(fieldName)
        form.setValue(fieldName, response.data as PathValue<T, Path<T>>)
        toast.success(successMessage)
      }
    })
  }

  return {
    handleUpload,
    handleFetch,
    isUploading,
    isFetching: fetch.isPending,
  }
}
