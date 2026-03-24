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
import type { findSubcategoryByIdForAdmin } from "~/server/admin/subcategories/queries"
import { subcategoryUpsertSchema } from "~/server/admin/subcategories/schema"

type Props = ComponentProps<"form"> & {
  subcategory?: NonNullable<Awaited<ReturnType<typeof findSubcategoryByIdForAdmin>>>
}

export function SubcategoryForm({ className, title, subcategory, ...props }: Props) {
  const router = useRouter()
  const qc = useQueryClient()
  const id = useMemo(() => subcategory?.id ?? createId(), [subcategory?.id])

  const form = useForm({
    resolver: zodResolver(subcategoryUpsertSchema),
    values: {
      id,
      name: subcategory?.name ?? "",
      slug: subcategory?.slug ?? "",
    },
  })

  const mutation = useMutation(
    orpc.admin.subcategories.upsert.mutationOptions({
      onSuccess: data => {
        toast.success(`Focus area ${subcategory ? "updated" : "created"}`)
        void qc.invalidateQueries({ queryKey: orpc.admin.subcategories.key() })
        if (data?.id) router.push(`/admin/focus-areas/${data.id}`)
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
    enabled: !subcategory,
  })

  return (
    <Form {...form}>
      <Stack className="justify-between">
        <H3 className="truncate">{title}</H3>
        <Button type="button" variant="secondary" size="sm" asChild>
          <Link href="/admin/focus-areas">Back</Link>
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
        <Button type="submit" variant="primary" disabled={mutation.isPending}>
          Save
        </Button>
      </form>
    </Form>
  )
}
