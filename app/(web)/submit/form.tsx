"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import type { ComponentProps } from "react"
import { Controller, FormProvider as Form, useForm } from "react-hook-form"
import { toast } from "sonner"
import { Button } from "~/components/common/button"
import { Checkbox } from "~/components/common/checkbox"
import { Field, FieldError, FieldLabel } from "~/components/common/field"
import { Hint } from "~/components/common/hint"
import { Input } from "~/components/common/input"
import { TextArea } from "~/components/common/textarea"
import { FeatureNudge } from "~/components/web/feature-nudge"
import { useTrackEvent } from "~/hooks/use-track-event"
import { orpc } from "~/lib/orpc-query"
import { isToolPremiumTier, isToolPublished } from "~/lib/tools"
import { cx } from "~/lib/utils"
import { createSubmitToolSchema } from "~/server/web/shared/schema"

export const SubmitForm = ({ className, ...props }: ComponentProps<"form">) => {
  const router = useRouter()
  const trackEvent = useTrackEvent()
  const t = useTranslations("forms.submit")
  const tSchema = useTranslations("schema")

  const schema = createSubmitToolSchema(tSchema)

  const form = useForm({
    resolver: zodResolver(schema),
    values: {
      name: "",
      websiteUrl: "",
      submitterNote: "",
      newsletterOptIn: true,
    },
  })

  const mutation = useMutation(
    orpc.web.tools.submit.mutationOptions({
      onSuccess: data => {
        form.reset()

        // Track event
        trackEvent("submit_tool", { slug: data.slug })

        if (isToolPublished(data)) {
          if (isToolPremiumTier(data)) {
            toast.info(t("already_published", { name: data.name }))
          } else {
            toast.custom(toastT => <FeatureNudge tool={data} t={toastT} />, {
              duration: Number.POSITIVE_INFINITY,
            })
          }
          router.push(`/${data.slug}`)
        } else {
          toast.success(t("submitted_success", { name: data.name }))
          router.push(`/submit/${data.slug}`)
        }
      },

      onError: error => {
        toast.error(error.message)
      },
    }),
  )

  const onSubmit = form.handleSubmit(data => mutation.mutate(data))

  return (
    <Form {...form}>
      <form
        onSubmit={onSubmit}
        className={cx("grid w-full gap-5 @md:grid-cols-2", className)}
        noValidate
        {...props}
      >
        <Controller
          control={form.control}
          name="name"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel data-required htmlFor={field.name}>
                {t("name_label")}:
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
          name="websiteUrl"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel data-required htmlFor={field.name}>
                {t("website_label")}:
              </FieldLabel>
              <Input
                id={field.name}
                type="url"
                size="lg"
                placeholder={t("website_placeholder")}
                {...field}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="submitterNote"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="col-span-full">
              <FieldLabel htmlFor={field.name}>{t("note_label")}:</FieldLabel>
              <TextArea id={field.name} size="lg" placeholder={t("note_placeholder")} {...field} />
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
              className="col-span-full items-center gap-2"
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

        {mutation.error && <Hint className="col-span-full">{mutation.error.message}</Hint>}

        <div className="col-span-full">
          <Button variant="primary" isPending={mutation.isPending} className="flex min-w-32">
            {t("submit_button")}
          </Button>
        </div>
      </form>
    </Form>
  )
}
