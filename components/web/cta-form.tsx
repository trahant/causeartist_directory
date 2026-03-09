"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import type { ComponentProps } from "react"
import { Controller, FormProvider as Form, useForm } from "react-hook-form"
import { Box } from "~/components/common/box"
import { Button } from "~/components/common/button"
import { Hint } from "~/components/common/hint"
import { Input } from "~/components/common/input"
import { useTrackEvent } from "~/hooks/use-track-event"
import { webOrpc } from "~/lib/orpc-query"
import { cx } from "~/lib/utils"
import { createNewsletterSchema } from "~/server/web/shared/schema"

type ButtonProps = ComponentProps<typeof Button>
type InputProps = ComponentProps<typeof Input>

type CTAFormProps = ComponentProps<"form"> & {
  placeholder?: string
  size?: Extract<InputProps["size"], "md" | "lg">
  buttonProps?: ButtonProps
}

export const CTAForm = ({
  children,
  className,
  placeholder,
  size = "md",
  buttonProps,
  ...props
}: CTAFormProps) => {
  const t = useTranslations("forms.subscribe")
  const tSchema = useTranslations("schema")
  const trackEvent = useTrackEvent()

  const schema = createNewsletterSchema(tSchema)

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      captcha: "" as const,
      email: "",
    },
  })

  const mutation = useMutation(
    webOrpc.subscribe.subscribe.mutationOptions({
      onSuccess: () => {
        trackEvent("subscribe_newsletter", { email: form.getValues("email") })
      },
      onSettled: () => {
        form.reset()
      },
    }),
  )

  const onSubmit = form.handleSubmit(data => mutation.mutate(data))

  const defaultPlaceholder = placeholder || t("email_placeholder")
  const defaultButtonProps = buttonProps || { size: "sm" }

  return (
    <Form {...form}>
      <form
        onSubmit={onSubmit}
        className={cx("flex flex-col gap-3 w-full", className)}
        noValidate
        {...props}
      >
        <Controller
          control={form.control}
          name="captcha"
          render={({ field }) => <input type="hidden" {...field} />}
        />

        <Box focusWithin>
          <div className="flex w-full bg-background rounded-lg">
            <Controller
              control={form.control}
              name="email"
              render={({ field }) => (
                <Input
                  type="email"
                  placeholder={defaultPlaceholder}
                  size={size}
                  className="flex-1 min-w-0 border-0 focus-visible:outline-none"
                  data-1p-ignore
                  {...field}
                />
              )}
            />

            <Button
              isPending={mutation.isPending}
              className={cx(
                "shrink-0",
                size === "lg" ? "text-sm/tight px-4 py-2 m-1" : "px-3 py-1.5 m-0.5",
              )}
              {...defaultButtonProps}
            >
              {t(`button_${size}`)}
            </Button>
          </div>
        </Box>

        {(mutation.error || form.formState.errors.email) && (
          <Hint className="-mt-1">
            {mutation.error?.message || form.formState.errors.email?.message}
          </Hint>
        )}

        {mutation.isSuccess && <p className="text-sm text-green-600">{t("success_message")}</p>}

        {children}
      </form>
    </Form>
  )
}
