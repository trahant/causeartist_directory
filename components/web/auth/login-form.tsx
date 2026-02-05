"use client"

import { InboxIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import type { ComponentProps } from "react"
import { Controller, FormProvider as Form } from "react-hook-form"
import { toast } from "sonner"
import { Button } from "~/components/common/button"
import { Field, FieldError } from "~/components/common/field"
import { Input } from "~/components/common/input"
import { Stack } from "~/components/common/stack"
import { useMagicLink } from "~/hooks/use-magic-link"

export const LoginForm = ({ ...props }: ComponentProps<"form">) => {
  const t = useTranslations()
  const router = useRouter()

  const { form, handleSignIn, isPending } = useMagicLink({
    onSuccess: email => {
      router.push(`/auth/verify?email=${email}`)
    },

    onError: ({ error }) => {
      toast.error(error.message)
    },
  })

  return (
    <Form {...form}>
      <Stack direction="column" className="items-stretch" asChild>
        <form onSubmit={form.handleSubmit(handleSignIn)} noValidate {...props}>
          <Controller
            control={form.control}
            name="email"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <Input
                  id={field.name}
                  type="email"
                  size="lg"
                  placeholder={t("forms.sign_in.email_placeholder")}
                  data-1p-ignore
                  {...field}
                />

                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Button suffix={<InboxIcon />} isPending={isPending}>
            {t("forms.sign_in.magic_link_button")}
          </Button>
        </form>
      </Stack>
    </Form>
  )
}
