import { experimental_useObject as useObject } from "@ai-sdk/react"
import { TypeValidationError } from "ai"
import { ComponentProps, useEffect } from "react"
import { toast } from "sonner"
import type { z } from "zod"
import { AIGenerate } from "~/components/admin/ai/generate"
import { Button } from "~/components/common/button"

type AIGenerateDescriptionProps<T extends z.ZodSchema> = ComponentProps<typeof Button> & {
  prompt?: string
  schema: T
  onGenerate?: () => void
  onFinish?: () => void
  onStream: (object: z.infer<T>) => void
}

export const AIGenerateDescription = <T extends z.ZodSchema>({
  prompt,
  schema,
  onGenerate,
  onFinish,
  onStream,
  ...props
}: AIGenerateDescriptionProps<T>) => {
  const errorMessage = "Something went wrong. Please check the console for more details."
  const successMessage = "Content generated successfully. Please save the page to update."

  const { object, submit, stop, isLoading } = useObject({
    api: "/admin/api/ai/generate-description",
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
    submit({ prompt })
  }

  return (
    <AIGenerate
      onGenerate={handleGenerate}
      stop={stop}
      isLoading={isLoading}
      buttonText="Generate Description"
      {...props}
    />
  )
}
