"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useHookFormAction } from "@next-safe-action/adapter-react-hook-form/hooks"
import { useTranslations } from "next-intl"
import type { ComponentProps } from "react"
import { Box } from "~/components/common/box"
import { Button } from "~/components/common/button"
import { Form, FormControl, FormField } from "~/components/common/form"
import { Hint } from "~/components/common/hint"
import { Input } from "~/components/common/input"
import { useTrackEvent } from "~/hooks/use-track-event"
import { cx } from "~/lib/utils"
import { subscribeToNewsletter as subscribe } from "~/server/web/actions/subscribe"
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
  const t = useTranslations("forms.cta")
  const tSchema = useTranslations("schema")
  const trackEvent = useTrackEvent()

  const schema = createNewsletterSchema(tSchema)
  const resolver = zodResolver(schema)

  const defaultPlaceholder = placeholder || t("email_placeholder")
  const defaultButtonProps = buttonProps || { size: "sm" }

  const { form, action, handleSubmitWithAction } = useHookFormAction(subscribe, resolver, {
    formProps: {
      defaultValues: {
        captcha: "",
        email: "",
      },
    },

    actionProps: {
      onSuccess: () => {
        trackEvent("subscribe_newsletter", { email: form.getValues("email") })
      },

      onSettled: () => {
        form.reset()
      },
    },
  })

  return (
    <Form {...form}>
      <form
        onSubmit={handleSubmitWithAction}
        className={cx("flex flex-col gap-3 w-full", className)}
        noValidate
        {...props}
      >
        <FormField
          control={form.control}
          name="captcha"
          render={({ field }) => (
            <FormControl>
              <Input type="hidden" {...field} />
            </FormControl>
          )}
        />

        <Box focusWithin>
          <div className="flex w-full bg-background rounded-lg">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormControl>
                  <Input
                    type="email"
                    placeholder={defaultPlaceholder}
                    size={size}
                    className="flex-1 min-w-0 border-0 focus-visible:outline-none"
                    data-1p-ignore
                    {...field}
                  />
                </FormControl>
              )}
            />

            <Button
              isPending={action.isPending}
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

        {(action.result.serverError || form.formState.errors.email) && (
          <Hint className="-mt-1">
            {action.result.serverError || form.formState.errors.email?.message}
          </Hint>
        )}

        {action.result.data && <p className="text-sm text-green-600">{action.result.data}</p>}

        {children}
      </form>
    </Form>
  )
}
