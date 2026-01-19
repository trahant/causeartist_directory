"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useHookFormAction } from "@next-safe-action/adapter-react-hook-form/hooks"
import { slugify } from "@primoui/utils"
import { useRouter } from "next/navigation"
import { type ComponentProps, use } from "react"
import { toast } from "sonner"
import { TagActions } from "~/app/admin/tags/_components/tag-actions"
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
import { RelationSelector } from "~/components/common/relation-selector"
import { Stack } from "~/components/common/stack"
import { useComputedField } from "~/hooks/use-computed-field"
import { cx } from "~/lib/utils"
import { upsertTag } from "~/server/admin/tags/actions"
import type { findTagBySlug } from "~/server/admin/tags/queries"
import { tagSchema } from "~/server/admin/tags/schema"
import type { findToolList } from "~/server/admin/tools/queries"

type TagFormProps = ComponentProps<"form"> & {
  tag?: Awaited<ReturnType<typeof findTagBySlug>>
  toolsPromise: ReturnType<typeof findToolList>
}

export function TagForm({ children, className, title, tag, toolsPromise, ...props }: TagFormProps) {
  const router = useRouter()
  const tools = use(toolsPromise)
  const resolver = zodResolver(tagSchema)

  const { form, action, handleSubmitWithAction } = useHookFormAction(upsertTag, resolver, {
    formProps: {
      defaultValues: {
        id: tag?.id ?? "",
        name: tag?.name ?? "",
        slug: tag?.slug ?? "",
        tools: tag?.tools.map(t => t.id) ?? [],
      },
    },

    actionProps: {
      onSuccess: ({ data }) => {
        toast.success(`Tag successfully ${tag ? "updated" : "created"}`)
        router.push(`/admin/tags/${data?.slug}`)
      },

      onError: ({ error }) => {
        toast.error(error.serverError)
      },
    },
  })

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
        onSubmit={handleSubmitWithAction}
        className={cx("grid gap-4 @lg:grid-cols-2", className)}
        noValidate
        {...props}
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel isRequired>Name</FormLabel>
              <FormControl>
                <Input {...field} />
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

        <FormField
          control={form.control}
          name="tools"
          render={({ field }) => (
            <FormItem className="col-span-full">
              <FormLabel>Tools</FormLabel>
              <RelationSelector relations={tools} ids={field.value ?? []} setIds={field.onChange} />
            </FormItem>
          )}
        />

        <div className="flex justify-between gap-4 col-span-full">
          <Button size="md" variant="secondary" asChild>
            <Link href="/admin/tags">Cancel</Link>
          </Button>

          <Button size="md" isPending={action.isPending}>
            {tag ? "Update tag" : "Create tag"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
