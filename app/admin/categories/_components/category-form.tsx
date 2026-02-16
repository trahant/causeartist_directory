"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useHotkeys } from "@mantine/hooks"
import { createId } from "@paralleldrive/cuid2"
import { slugify } from "@primoui/utils"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { type ComponentProps, useMemo } from "react"
import { Controller, FormProvider as Form, useForm } from "react-hook-form"
import { toast } from "sonner"
import { CategoryActions } from "~/app/admin/categories/_components/category-actions"
import { AIGenerateDescription } from "~/components/admin/ai/generate-description"
import { Button } from "~/components/common/button"
import { Field, FieldError, FieldLabel } from "~/components/common/field"
import { H3 } from "~/components/common/heading"
import { Input } from "~/components/common/input"
import { Kbd } from "~/components/common/kbd"
import { Link } from "~/components/common/link"
import { RelationSelector } from "~/components/common/relation-selector"
import { Stack } from "~/components/common/stack"
import { TextArea } from "~/components/common/textarea"
import { useComputedField } from "~/hooks/use-computed-field"
import { orpc } from "~/lib/orpc-query"
import { cx } from "~/lib/utils"
import type { findCategoryById } from "~/server/admin/categories/queries"
import { categorySchema } from "~/server/admin/categories/schema"
import { descriptionSchema } from "~/server/admin/shared/schema"

type CategoryFormProps = ComponentProps<"form"> & {
  category?: NonNullable<Awaited<ReturnType<typeof findCategoryById>>>
}

export function CategoryForm({ className, title, category, ...props }: CategoryFormProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data: tools = [] } = useQuery(orpc.tools.lookup.queryOptions())

  const id = useMemo(() => category?.id ?? createId(), [category?.id])

  const form = useForm({
    resolver: zodResolver(categorySchema),
    values: {
      id,
      name: category?.name ?? "",
      slug: category?.slug ?? "",
      label: category?.label ?? "",
      description: category?.description ?? "",
      tools: category?.tools.map(t => t.id) ?? [],
    },
  })

  const mutation = useMutation(
    orpc.categories.upsert.mutationOptions({
      onSuccess: data => {
        toast.success(`Category successfully ${category ? "updated" : "created"}`)
        queryClient.invalidateQueries({ queryKey: orpc.categories.key() })
        router.push(`/admin/categories/${data.id}`)
      },

      onError: error => {
        toast.error(error.message)
      },
    }),
  )

  const onSubmit = form.handleSubmit(data => mutation.mutate(data))

  useHotkeys([["mod+enter", () => onSubmit()]], [], true)

  const name = form.watch("name")

  // Set the slug based on the name
  useComputedField({
    form,
    sourceField: "name",
    computedField: "slug",
    callback: slugify,
    enabled: !category,
  })

  // Set the label based on the name
  useComputedField({
    form,
    sourceField: "name",
    computedField: "label",
    callback: name => name && `${name} Tools`,
    enabled: !category,
  })

  return (
    <Form {...form}>
      <Stack className="justify-between">
        <H3 className="flex-1 truncate">{title}</H3>

        <Stack size="sm" className="-my-0.5">
          <AIGenerateDescription
            prompt={`Create a compelling description for the category named "${name}". Begin with a plural noun phrase (e.g., "Tools for..." or "Resources that..."). Craft a single, concise sentence that clearly conveys the purpose and value of this category. Ensure the description is specific enough to differentiate this category from others while remaining broad enough to encompass all relevant items within it.`}
            schema={descriptionSchema}
            onStream={object => form.setValue("description", object.description)}
            disabled={!form.formState.isValid}
          />

          {category && <CategoryActions category={category} size="md" />}
        </Stack>
      </Stack>

      <form
        onSubmit={onSubmit}
        className={cx("grid gap-4 @lg:grid-cols-2", className)}
        noValidate
        {...props}
      >
        <div className="grid gap-4 @lg:grid-cols-2">
          <Controller
            control={form.control}
            name="name"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel data-required htmlFor={field.name}>
                  Name
                </FieldLabel>
                <Input id={field.name} data-1p-ignore {...field} />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            control={form.control}
            name="slug"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel data-required htmlFor={field.name}>
                  Slug
                </FieldLabel>
                <Input id={field.name} {...field} />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </div>

        <Controller
          control={form.control}
          name="label"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Label</FieldLabel>
              <Input id={field.name} {...field} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="description"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="col-span-full">
              <FieldLabel htmlFor={field.name}>Description</FieldLabel>
              <TextArea id={field.name} {...field} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="tools"
          render={({ field }) => (
            <Field className="col-span-full">
              <FieldLabel>Tools</FieldLabel>
              <RelationSelector relations={tools} ids={field.value ?? []} setIds={field.onChange} />
            </Field>
          )}
        />

        <div className="flex justify-between gap-4 col-span-full">
          <Button size="md" variant="secondary" asChild>
            <Link href="/admin/categories">Cancel</Link>
          </Button>

          <Button
            size="md"
            isPending={mutation.isPending}
            suffix={<Kbd variant="outline" keys={["meta", "enter"]} />}
          >
            {category ? "Update category" : "Create category"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
