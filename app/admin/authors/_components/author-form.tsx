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
import { TextArea } from "~/components/common/textarea"
import { useComputedField } from "~/hooks/use-computed-field"
import { orpc } from "~/lib/orpc-query"
import { cx } from "~/lib/utils"
import type { findAuthorByIdForAdmin } from "~/server/admin/authors/queries"
import { authorUpsertSchema } from "~/server/admin/authors/schema"

type Props = ComponentProps<"form"> & {
  author?: NonNullable<Awaited<ReturnType<typeof findAuthorByIdForAdmin>>>
}

export function AuthorForm({ className, title, author, ...props }: Props) {
  const router = useRouter()
  const qc = useQueryClient()
  const id = useMemo(() => author?.id ?? createId(), [author?.id])

  const form = useForm({
    resolver: zodResolver(authorUpsertSchema),
    values: {
      id,
      name: author?.name ?? "",
      slug: author?.slug ?? "",
      bio: author?.bio ?? "",
      avatarUrl: author?.avatarUrl ?? "",
      twitter: author?.twitter ?? "",
      linkedin: author?.linkedin ?? "",
    },
  })

  const mutation = useMutation(
    orpc.admin.authors.upsert.mutationOptions({
      onSuccess: data => {
        toast.success(`Author ${author ? "updated" : "created"}`)
        void qc.invalidateQueries({ queryKey: orpc.admin.authors.key() })
        if (data?.id) router.push(`/admin/authors/${data.id}`)
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
    enabled: !author,
  })

  return (
    <Form {...form}>
      <Stack className="justify-between">
        <H3 className="truncate">{title}</H3>
        <Button type="button" variant="secondary" size="sm" asChild>
          <Link href="/admin/authors">Back</Link>
        </Button>
      </Stack>
      <form
        onSubmit={onSubmit}
        className={cx("grid gap-4 @lg:grid-cols-2", className)}
        noValidate
        {...props}
      >
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
          name="bio"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="@lg:col-span-2">
              <FieldLabel htmlFor={field.name}>Bio</FieldLabel>
              <TextArea id={field.name} {...field} value={field.value ?? ""} rows={5} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="avatarUrl"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="@lg:col-span-2">
              <FieldLabel htmlFor={field.name}>Avatar URL</FieldLabel>
              <Input {...field} id={field.name} value={field.value ?? ""} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="twitter"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Twitter / X</FieldLabel>
              <Input {...field} id={field.name} value={field.value ?? ""} placeholder="@handle or URL" />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="linkedin"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>LinkedIn</FieldLabel>
              <Input {...field} id={field.name} value={field.value ?? ""} placeholder="URL" />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <div className="@lg:col-span-2">
          <Button type="submit" variant="primary" disabled={mutation.isPending}>
            Save
          </Button>
        </div>
      </form>
    </Form>
  )
}
