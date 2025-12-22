import { zodResolver } from "@hookform/resolvers/zod"
import type { ErrorContext } from "better-auth/react"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { useForm } from "react-hook-form"
import type { z } from "zod"
import { useAuthCallbackUrl } from "~/hooks/use-auth-callback-url"
import { signIn } from "~/lib/auth-client"
import { createNewsletterSchema } from "~/server/web/shared/schema"

type UseMagicLinkProps = {
  onSuccess?: (email: string) => void
  onError?: (error: ErrorContext) => void
}

export const useMagicLink = ({ onSuccess, onError }: UseMagicLinkProps = {}) => {
  const t = useTranslations("schema")
  const [isPending, setIsPending] = useState(false)
  const callbackURL = useAuthCallbackUrl()

  const schema = createNewsletterSchema(t)
  const resolver = zodResolver(schema)
  const defaultValues = { captcha: "", email: "" } as const
  const form = useForm<z.infer<typeof schema>>({ resolver, defaultValues })

  const handleSignIn = ({ email }: z.infer<typeof schema>) => {
    signIn.magicLink({
      email,
      callbackURL,
      fetchOptions: {
        onResponse: () => {
          setIsPending(false)
          form.reset()
        },
        onRequest: () => setIsPending(true),
        onSuccess: () => onSuccess?.(email),
        onError: error => onError?.(error),
      },
    })
  }

  return { form, handleSignIn, isPending }
}
