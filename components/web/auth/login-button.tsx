"use client"

import { capitalCase } from "change-case"
import { useTranslations } from "next-intl"
import { type ComponentProps, useState } from "react"
import { toast } from "sonner"
import { Button } from "~/components/common/button"
import { useAuthCallbackUrl } from "~/hooks/use-auth-callback-url"
import { signIn } from "~/lib/auth-client"

type LoginButtonProps = ComponentProps<typeof Button> & {
  provider: "google" | "github"
}

export const LoginButton = ({ provider, ...props }: LoginButtonProps) => {
  const t = useTranslations()
  const [isPending, setIsPending] = useState(false)
  const callbackURL = useAuthCallbackUrl()

  const handleSignIn = async () => {
    try {
      await signIn.social({
        provider,
        callbackURL,
        fetchOptions: {
          onRequest: () => {
            setIsPending(true)
          },
          onError: ({ error }) => {
            toast.error(error.message)
            setIsPending(false)
          },
        },
      })
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong")
      setIsPending(false)
    }
  }

  return (
    <Button size="lg" variant="secondary" onClick={handleSignIn} isPending={isPending} {...props}>
      {t("forms.sign_in.continue_with", { provider: capitalCase(provider) })}
    </Button>
  )
}
