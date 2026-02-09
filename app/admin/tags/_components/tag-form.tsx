"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useHotkeys } from "@mantine/hooks"
import { slugify } from "@primoui/utils"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { type ComponentProps, use } from "react"
import { Controller, FormProvider as Form, useForm } from "react-hook-form"
import { toast } from "sonner"
import { TagActions } from "~/app/admin/tags/_components/tag-actions"
import { Button } from "~/components/common/button"
import { Field, FieldError, FieldLabel } from "~/components/common/field"
import { H3 } from "~/components/common/heading"
import { Input } from "~/components/common/input"
import { Kbd } from "~/components/common/kbd"
import { Link } from "~/components/common/link"
import { RelationSelector } from "~/components/common/relation-selector"
import { Stack } from "~/components/common/stack"
import { useComputedField } from "~/hooks/use-computed-field"
import { orpc } from "~/lib/orpc-query"
import { cx } from "~/lib/utils"
import type { findTagById } from "~/server/admin/tags/queries"
import { tagSchema } from "~/server/admin/tags/schema"
import type { findToolList } from "~/server/admin/tools/queries"

type TagFormProps = ComponentProps<"form"> & {
  tag?: Awaited<ReturnType<typeof findTagById>>
  toolsPromise: ReturnType<typeof findToolList>
}

export function TagForm({ className, title, tag, toolsPromise, ...props }: TagFormProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const tools = use(toolsPromise)

  const form = useForm({
    resolver: zodResolver(tagSchema),
    defaultValues: {
      id: tag?.id ?? "",
      name: tag?.name ?? "",
      slug: tag?.slug ?? "",
      tools: tag?.tools.map(t => t.id) ?? [],
    },
  })

  const mutation = useMutation(
    orpc.tags.upsert.mutationOptions({
      onSuccess: data => {
        toast.success(`Tag successfully ${tag ? "updated" : "created"}`)
        queryClient.invalidateQueries({ queryKey: orpc.tags.key() })
        router.push(`/admin/tags/${data.id}`)
      },

      onError: error => {
        toast.error(error.message)
      },
    }),
  )

  const onSubmit = form.handleSubmit(data => mutation.mutate(data))

  useHotkeys([["mod+enter", () => onSubmit()]], [], true)

  // Set the slug based on the name
  useComputedField({
    form,
    sourceField: "name",
    computedField: "slug",
    callback: slugify,
    enabled: !tag,
  })

  return (
    <Form {...form}>
      <Stack className="justify-between">
        <H3 className="flex-1 truncate">{title}</H3>

        <Stack size="sm" className="-my-0.5">
          {tag && <TagActions tag={tag} size="md" />}
        </Stack>
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
              <FieldLabel data-required htmlFor={field.name}>
                Slug
              </FieldLabel>
              <Input {...field} id={field.name} />
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
            <Link href="/admin/tags">Cancel</Link>
          </Button>

          <Button
            size="md"
            isPending={mutation.isPending}
            suffix={<Kbd variant="outline" keys={["meta", "enter"]} />}
          >
            {tag ? "Update tag" : "Create tag"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
