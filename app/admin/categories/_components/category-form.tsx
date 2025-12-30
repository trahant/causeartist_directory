"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useHookFormAction } from "@next-safe-action/adapter-react-hook-form/hooks"
import { slugify } from "@primoui/utils"
import { useRouter } from "next/navigation"
import { type ComponentProps, use } from "react"
import { toast } from "sonner"
import { CategoryActions } from "~/app/admin/categories/_components/category-actions"
import { AIGenerateDescription } from "~/components/admin/ai/generate-description"
import { RelationSelector } from "~/components/admin/relation-selector"
import { Button } from "~/components/common/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/common/form"
import { H3 } from "~/components/common/heading"
import { Input } from "~/components/common/input"
import { Link } from "~/components/common/link"
import { Stack } from "~/components/common/stack"
import { TextArea } from "~/components/common/textarea"
import { useComputedField } from "~/hooks/use-computed-field"
import { cx } from "~/lib/utils"
import { upsertCategory } from "~/server/admin/categories/actions"
import type { findCategoryBySlug } from "~/server/admin/categories/queries"
import { categorySchema } from "~/server/admin/categories/schema"
import { descriptionSchema } from "~/server/admin/shared/schema"
import type { findToolList } from "~/server/admin/tools/queries"

type CategoryFormProps = ComponentProps<"form"> & {
  category?: Awaited<ReturnType<typeof findCategoryBySlug>>
  toolsPromise: ReturnType<typeof findToolList>
}

export function CategoryForm({
  children,
  className,
  title,
  category,
  toolsPromise,
  ...props
}: CategoryFormProps) {
  const router = useRouter()
  const tools = use(toolsPromise)
  const resolver = zodResolver(categorySchema)

  const { form, action, handleSubmitWithAction } = useHookFormAction(upsertCategory, resolver, {
    formProps: {
      defaultValues: {
        id: category?.id ?? "",
        name: category?.name ?? "",
        slug: category?.slug ?? "",
        label: category?.label ?? "",
        description: category?.description ?? "",
        tools: category?.tools.map(t => t.id) ?? [],
      },
    },

    actionProps: {
      onSuccess: ({ data }) => {
        toast.success(`Category successfully ${category ? "updated" : "created"}`)
        router.push(`/admin/categories/${data?.slug}`)
      },

      onError: ({ error }) => {
        toast.error(error.serverError)
      },
    },
  })

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
          />

          {category && <CategoryActions category={category} size="md" />}
        </Stack>
      </Stack>

      <form
        onSubmit={handleSubmitWithAction}
        className={cx("grid gap-4 @lg:grid-cols-2", className)}
        noValidate
        {...props}
      >
        <div className="grid gap-4 @lg:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel isRequired>Name</FormLabel>
                <FormControl>
                  <Input data-1p-ignore {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="slug"
            render={({ field }) => (
              <FormItem>
                <FormLabel isRequired>Slug</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="label"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Label</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem className="col-span-full">
              <FormLabel>Description</FormLabel>
              <FormControl>
                <TextArea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tools"
          render={({ field }) => (
            <FormItem className="col-span-full">
              <FormLabel>Tools</FormLabel>
              <RelationSelector
                relations={tools}
                selectedIds={field.value ?? []}
                setSelectedIds={field.onChange}
              />
            </FormItem>
          )}
        />

        <div className="flex justify-between gap-4 col-span-full">
          <Button size="md" variant="secondary" asChild>
            <Link href="/admin/categories">Cancel</Link>
          </Button>

          <Button size="md" isPending={action.isPending}>
            {category ? "Update category" : "Create category"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
