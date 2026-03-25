"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import type { ComponentProps } from "react"
import { Controller, FormProvider as Form, useForm } from "react-hook-form"
import { Button } from "~/components/common/button"
import { Checkbox } from "~/components/common/checkbox"
import { Field, FieldError, FieldLabel } from "~/components/common/field"
import { Hint } from "~/components/common/hint"
import { Input } from "~/components/common/input"
import { TextArea } from "~/components/common/textarea"
import { useTrackEvent } from "~/hooks/use-track-event"
import { orpc } from "~/lib/orpc-query"
import { cx } from "~/lib/utils"
import { createContactFormSchema } from "~/server/web/shared/schema"

export const ContactForm = ({ className, ...props }: ComponentProps<"form">) => {
  const t = useTranslations("forms.contact")
  const tSchema = useTranslations("schema")
  const trackEvent = useTrackEvent()

  const schema = createContactFormSchema(tSchema)

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      captcha: "" as const,
      name: "",
      email: "",
      message: "",
      newsletterOptIn: false,
    },
  })

  const mutation = useMutation(
    orpc.web.contact.submit.mutationOptions({
      onSuccess: (_data, variables) => {
        trackEvent("contact_form_submit", { email: variables.email })
        form.reset({
          captcha: "" as const,
          name: "",
          email: "",
          message: "",
          newsletterOptIn: false,
        })
      },
    }),
  )

  const onSubmit = form.handleSubmit(data => mutation.mutate(data))

  return (
    <Form {...form}>
      <form
        onSubmit={onSubmit}
        className={cx("grid w-full max-w-xl gap-5", className)}
        noValidate
        {...props}
      >
        <Controller
          control={form.control}
          name="captcha"
          render={({ field }) => <input type="hidden" tabIndex={-1} autoComplete="off" {...field} />}
        />

        <Controller
          control={form.control}
          name="name"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel data-required htmlFor={field.name}>
                {t("name_label")}
              </FieldLabel>
              <Input
                id={field.name}
                size="lg"
                placeholder={t("name_placeholder")}
                data-1p-ignore
                {...field}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="email"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel data-required htmlFor={field.name}>
                {t("email_label")}
              </FieldLabel>
              <Input
                id={field.name}
                type="email"
                size="lg"
                placeholder={t("email_placeholder")}
                autoComplete="email"
                {...field}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="message"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel data-required htmlFor={field.name}>
                {t("message_label")}
              </FieldLabel>
              <TextArea
                id={field.name}
                size="lg"
                rows={6}
                placeholder={t("message_placeholder")}
                {...field}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="newsletterOptIn"
          render={({ field, fieldState }) => (
            <Field
              orientation="horizontal"
              className="items-center gap-2"
              data-invalid={fieldState.invalid}
            >
              <Checkbox id={field.name} checked={field.value} onCheckedChange={field.onChange} />
              <FieldLabel htmlFor={field.name} className="font-normal">
                {t("newsletter_label")}
              </FieldLabel>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {mutation.error && <Hint>{mutation.error.message}</Hint>}

        <div>
          <Button type="submit" variant="primary" isPending={mutation.isPending} className="min-w-32">
            {t("submit_button")}
          </Button>
        </div>

        {mutation.isSuccess && <p className="text-sm text-green-600">{t("success_message")}</p>}
      </form>
    </Form>
  )
}
