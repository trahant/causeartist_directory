import { experimental_useObject as useObject } from "@ai-sdk/react"
import { isValidUrl } from "@primoui/utils"
import { TypeValidationError } from "ai"
import { useEffect } from "react"
import { toast } from "sonner"
import type { z } from "zod"
import { AIGenerate } from "~/components/admin/ai/generate"

type AIGenerateContentProps<T extends z.ZodSchema> = {
  url: string
  schema: T
  onGenerate?: () => void
  onFinish?: () => void
  onStream: (object: z.infer<T>) => void
}

export const AIGenerateContent = <T extends z.ZodSchema>({
  url,
  schema,
  onGenerate,
  onFinish,
  onStream,
}: AIGenerateContentProps<T>) => {
  const errorMessage = "Something went wrong. Please check the console for more details."
  const successMessage = "Content generated successfully. Please save the page to update."

  const { object, submit, stop, isLoading } = useObject({
    api: "/admin/api/ai/generate-content",
    schema,

    onFinish: ({ error }) => {
      onFinish?.()

      if (error) {
        console.error(error)

        // TypeValidationError means content was generated but doesn't match schema perfectly
        // We still consider this a success since partial content is usually usable
        if (!TypeValidationError.isInstance(error)) {
          toast.error(errorMessage)
        }

        return
      }

      toast.success(successMessage)
    },

    onError: error => {
      toast.error(error.message)
    },
  })

  // Handle streaming updates from AI SDK
  useEffect(() => object && onStream(object), [object])

  const handleGenerate = () => {
    onGenerate?.()
    submit({ url })
  }

  return (
    <AIGenerate
      onGenerate={handleGenerate}
      stop={stop}
      isLoading={isLoading}
      buttonText="Generate Content"
      disabled={!isValidUrl(url)}
    />
  )
}
