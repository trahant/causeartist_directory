"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useHotkeys } from "@mantine/hooks"
import { slugify } from "@primoui/utils"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { type ComponentProps } from "react"
import { Controller, FormProvider as Form, useForm } from "react-hook-form"
import { toast } from "sonner"
import { Button } from "~/components/common/button"
import { Field, FieldError, FieldLabel } from "~/components/common/field"
import { H3 } from "~/components/common/heading"
import { Input } from "~/components/common/input"
import { Link } from "~/components/common/link"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/common/select"
import { Stack } from "~/components/common/stack"
import { TextArea } from "~/components/common/textarea"
import { useComputedField } from "~/hooks/use-computed-field"
import { orpc } from "~/lib/orpc-query"
import { cx } from "~/lib/utils"
import { findGlossaryTerm } from "~/server/admin/glossary-terms/queries"
import {
  type GlossaryTermFormValues,
  glossaryTermFormSchema,
} from "~/server/admin/glossary-terms/schema"

type GlossaryFormProps = ComponentProps<"form"> & {
  term?: NonNullable<Awaited<ReturnType<typeof findGlossaryTerm>>>
  title: string
}

export function GlossaryForm({ className, title, term, ...props }: GlossaryFormProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const isEdit = !!term

  const form = useForm<GlossaryTermFormValues, unknown, GlossaryTermFormValues>({
    resolver: zodResolver(glossaryTermFormSchema),
    values: isEdit
      ? {
          id: term.id,
          term: term.term,
          slug: term.slug,
          status: term.status,
          definition: term.definition ?? "",
          extendedContent: term.extendedContent ?? "",
          seoTitle: term.seoTitle ?? "",
          seoDescription: term.seoDescription ?? "",
        }
      : {
          term: "",
          slug: "",
          status: "draft",
          definition: "",
          extendedContent: "",
          seoTitle: "",
          seoDescription: "",
        },
  })

  const createMutation = useMutation(
    orpc.admin.glossaryTerms.create.mutationOptions({
      onSuccess: data => {
        toast.success("Glossary term created")
        void queryClient.invalidateQueries({ queryKey: orpc.admin.glossaryTerms.key() })
        if (data?.id) router.push(`/admin/glossary/${data.id}`)
      },
      onError: error => toast.error(error.message),
    }),
  )

  const updateMutation = useMutation(
    orpc.admin.glossaryTerms.update.mutationOptions({
      onSuccess: () => {
        toast.success("Glossary term updated")
        void queryClient.invalidateQueries({ queryKey: orpc.admin.glossaryTerms.key() })
      },
      onError: error => toast.error(error.message),
    }),
  )

  const pending = createMutation.isPending || updateMutation.isPending

  const runSave = (values: GlossaryTermFormValues) => {
    const { id, ...rest } = values
    if (id?.trim()) {
      updateMutation.mutate({ id, ...rest })
    } else {
      createMutation.mutate(rest)
    }
  }

  const onSubmit = form.handleSubmit(runSave)

  const publish = () => {
    form.setValue("status", "published")
    void form.handleSubmit(runSave)()
  }

  useHotkeys([["mod+enter", () => void onSubmit()]], [], true)

  useComputedField({
    form,
    sourceField: "term",
    computedField: "slug",
    callback: slugify,
    enabled: !term,
  })

  const viewHref = term?.status === "published" ? `/glossary/${term.slug}` : null

  return (
    <Form {...form}>
      <Stack className="justify-between">
        <H3 className="flex-1 truncate">{title}</H3>
        <div className="flex flex-wrap gap-2">
          {viewHref ? (
            <Button type="button" variant="secondary" size="sm" asChild>
              <Link href={viewHref} target="_blank" rel="noreferrer">
                View on site
              </Link>
            </Button>
          ) : null}
          <Button type="button" variant="secondary" size="sm" asChild>
            <Link href="/admin/glossary">Back to list</Link>
          </Button>
        </div>
      </Stack>

      <form onSubmit={onSubmit} className={cx("grid gap-4 @lg:grid-cols-2", className)} noValidate {...props}>
        <Controller
          control={form.control}
          name="term"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="@lg:col-span-2">
              <FieldLabel data-required htmlFor={field.name}>
                Term
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
            <Field data-invalid={fieldState.invalid} className="@lg:col-span-2">
              <FieldLabel htmlFor={field.name}>Slug</FieldLabel>
              <Input {...field} id={field.name} className="font-mono text-sm" />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="status"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="@lg:col-span-2">
              <FieldLabel htmlFor={field.name}>Status</FieldLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id={field.name}>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">draft</SelectItem>
                  <SelectItem value="published">published</SelectItem>
                </SelectContent>
              </Select>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="definition"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="@lg:col-span-2">
              <FieldLabel htmlFor={field.name}>Definition</FieldLabel>
              <TextArea id={field.name} {...field} value={field.value ?? ""} rows={4} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="extendedContent"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="@lg:col-span-2">
              <FieldLabel htmlFor={field.name}>Extended content</FieldLabel>
              <TextArea id={field.name} {...field} value={field.value ?? ""} rows={8} className="font-mono text-sm" />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="seoTitle"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="@lg:col-span-2">
              <FieldLabel htmlFor={field.name}>SEO title</FieldLabel>
              <Input {...field} id={field.name} value={field.value ?? ""} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="seoDescription"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="@lg:col-span-2">
              <FieldLabel htmlFor={field.name}>SEO description</FieldLabel>
              <TextArea id={field.name} {...field} value={field.value ?? ""} rows={2} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <div className="@lg:col-span-2 flex flex-wrap gap-2">
          <Button type="submit" variant="primary" disabled={pending}>
            Save
          </Button>
          <Button type="button" variant="secondary" disabled={pending} onClick={publish}>
            Save and publish
          </Button>
        </div>
      </form>
    </Form>
  )
}
