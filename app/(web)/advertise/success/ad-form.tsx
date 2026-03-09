"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import type { ComponentProps } from "react"
import { Controller, FormProvider as Form, useForm } from "react-hook-form"
import { toast } from "sonner"
import { Button } from "~/components/common/button"
import { Field, FieldError, FieldLabel } from "~/components/common/field"
import { Input } from "~/components/common/input"
import { Note } from "~/components/common/note"
import { Stack } from "~/components/common/stack"
import { TextArea } from "~/components/common/textarea"
import { orpc } from "~/lib/orpc-query"
import { cx } from "~/lib/utils"
import type { AdOne } from "~/server/web/ads/payloads"
import { createAdDetailsSchema } from "~/server/web/shared/schema"

type AdFormProps = ComponentProps<"form"> & {
  sessionId: string
  ad?: AdOne | null
}

export const AdForm = ({ className, sessionId, ad, ...props }: AdFormProps) => {
  const t = useTranslations("forms.ad_details")
  const tSchema = useTranslations("schema")

  const schema = createAdDetailsSchema(tSchema)

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      sessionId,
      name: ad?.name ?? "",
      websiteUrl: ad?.websiteUrl ?? "",
      description: ad?.description ?? "",
      buttonLabel: ad?.buttonLabel ?? "",
    },
  })

  const { mutate, isPending } = useMutation(
    orpc.web.ads.createFromCheckout.mutationOptions({
      onSuccess: () => {
        toast.success(t(`${ad ? "update" : "create"}.success_message`))
      },
      onError: error => {
        toast.error(error.message)
      },
    }),
  )

  const onSubmit = form.handleSubmit(data => {
    mutate(data)
  })

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
                {t("name_label")}
              </FieldLabel>
              <Input id={field.name} size="lg" placeholder={t("name_placeholder")} {...field} />
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
                {t("website_url_label")}
              </FieldLabel>
              <Input
                id={field.name}
                type="url"
                size="lg"
                placeholder={t("website_url_placeholder")}
                {...field}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="description"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <Stack className="w-full justify-between">
                <FieldLabel data-required htmlFor={field.name}>
                  {t("description_label")}
                </FieldLabel>
                <Note className="text-xs">{t("description_note")}</Note>
              </Stack>
              <TextArea
                id={field.name}
                size="lg"
                placeholder={t("description_placeholder")}
                {...field}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="buttonLabel"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>{t("button_label")}</FieldLabel>
              <Input id={field.name} size="lg" placeholder={t("button_placeholder")} {...field} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Button type="submit" className="col-span-full" isPending={isPending}>
          {t(`${ad ? "update" : "create"}.button_label`)}
        </Button>
      </form>
    </Form>
  )
}
