"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useHotkeys } from "@mantine/hooks"
import { createId } from "@paralleldrive/cuid2"
import { slugify } from "@primoui/utils"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { type ComponentProps, useMemo } from "react"
import { Controller, FormProvider as Form, useForm } from "react-hook-form"
import { toast } from "sonner"
import { Button } from "~/components/common/button"
import { Field, FieldError, FieldLabel } from "~/components/common/field"
import { H3 } from "~/components/common/heading"
import { Input } from "~/components/common/input"
import { Link } from "~/components/common/link"
import { Stack } from "~/components/common/stack"
import { useComputedField } from "~/hooks/use-computed-field"
import { orpc } from "~/lib/orpc-query"
import { cx } from "~/lib/utils"
import type { findLocationByIdForAdmin } from "~/server/admin/locations/queries"
import { locationUpsertSchema } from "~/server/admin/locations/schema"

type Props = ComponentProps<"form"> & {
  location?: NonNullable<Awaited<ReturnType<typeof findLocationByIdForAdmin>>>
}

export function LocationForm({ className, title, location, ...props }: Props) {
  const router = useRouter()
  const qc = useQueryClient()
  const id = useMemo(() => location?.id ?? createId(), [location?.id])

  const form = useForm({
    resolver: zodResolver(locationUpsertSchema),
    values: {
      id,
      name: location?.name ?? "",
      slug: location?.slug ?? "",
      country: location?.country ?? "",
      region: location?.region ?? "",
      countryCode: location?.countryCode ?? "",
    },
  })

  const mutation = useMutation(
    orpc.admin.locations.upsert.mutationOptions({
      onSuccess: data => {
        toast.success(`Location ${location ? "updated" : "created"}`)
        void qc.invalidateQueries({ queryKey: orpc.admin.locations.key() })
        if (data?.id) router.push(`/admin/locations/${data.id}`)
      },
      onError: e => toast.error(e.message),
    }),
  )

  const onSubmit = form.handleSubmit(d => mutation.mutate(d))
  useHotkeys([["mod+enter", () => void onSubmit()]], [], true)

  useComputedField({
    form,
    sourceField: "name",
    computedField: "slug",
    callback: slugify,
    enabled: !location,
  })

  return (
    <Form {...form}>
      <Stack className="justify-between">
        <H3 className="truncate">{title}</H3>
        <Button type="button" variant="secondary" size="sm" asChild>
          <Link href="/admin/locations">Back</Link>
        </Button>
      </Stack>
      <form onSubmit={onSubmit} className={cx("grid gap-4", className)} noValidate {...props}>
        <Controller
          control={form.control}
          name="name"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel data-required htmlFor={field.name}>
                Name
              </FieldLabel>
              <Input {...field} id={field.name} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="slug"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Slug</FieldLabel>
              <Input {...field} id={field.name} className="font-mono text-sm" />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="country"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Country</FieldLabel>
              <Input {...field} id={field.name} value={field.value ?? ""} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="region"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Region</FieldLabel>
              <Input {...field} id={field.name} value={field.value ?? ""} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="countryCode"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Country code (ISO-2)</FieldLabel>
              <Input {...field} id={field.name} value={field.value ?? ""} maxLength={2} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Button type="submit" variant="primary" disabled={mutation.isPending}>
          Save
        </Button>
      </form>
    </Form>
  )
}
