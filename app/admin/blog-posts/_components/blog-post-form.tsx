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
import { Button } from "~/components/common/button"
import { Field, FieldError, FieldLabel } from "~/components/common/field"
import { H3 } from "~/components/common/heading"
import { Input } from "~/components/common/input"
import { Link } from "~/components/common/link"
import { Note } from "~/components/common/note"
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
import { articleContentTypes, stringifyArticleJsonField } from "~/lib/article-seo-json"
import { orpc } from "~/lib/orpc-query"
import { cx } from "~/lib/utils"
import type { findBlogPostByIdForAdmin } from "~/server/admin/blog-posts/queries"
import { blogPostUpsertSchema } from "~/server/admin/blog-posts/schema"

type BlogPostFormProps = ComponentProps<"form"> & {
  post?: NonNullable<Awaited<ReturnType<typeof findBlogPostByIdForAdmin>>>
}

function toLocalDatetimeValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function BlogPostForm({ className, title, post, ...props }: BlogPostFormProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data: authors = [] } = useQuery(orpc.admin.authors.lookup.queryOptions())
  const id = useMemo(() => post?.id ?? createId(), [post?.id])

  const form = useForm({
    resolver: zodResolver(blogPostUpsertSchema),
    values: {
      id,
      title: post?.title ?? "",
      slug: post?.slug ?? "",
      status: post?.status ?? "draft",
      excerpt: post?.excerpt ?? "",
      content: post?.content ?? "",
      heroImageUrl: post?.heroImageUrl ?? "",
      seoTitle: post?.seoTitle ?? "",
      seoDescription: post?.seoDescription ?? "",
      publishedAt: post?.publishedAt ?? null,
      authorId: post?.authorId ?? null,
      canonicalUrl: post?.canonicalUrl ?? "",
      ogImageUrl: post?.ogImageUrl ?? "",
      ogImageAlt: post?.ogImageAlt ?? "",
      metaRobots: post?.metaRobots ?? "",
      focusKeyword: post?.focusKeyword ?? "",
      secondaryKeywordsJson: stringifyArticleJsonField(post?.secondaryKeywords),
      lastReviewedAt: post?.lastReviewedAt ?? null,
      reviewedBy: post?.reviewedBy ?? "",
      sourcesJson: stringifyArticleJsonField(post?.sources),
      faqItemsJson: stringifyArticleJsonField(post?.faqItems),
      keyTakeawaysJson: stringifyArticleJsonField(post?.keyTakeaways),
      readingTimeMinutes: post?.readingTimeMinutes ?? null,
      contentType: post?.contentType ?? "",
    },
  })

  const mutation = useMutation(
    orpc.admin.blogPosts.upsert.mutationOptions({
      onSuccess: data => {
        toast.success(`Blog post ${post ? "updated" : "created"}`)
        void queryClient.invalidateQueries({ queryKey: orpc.admin.blogPosts.key() })
        if (data?.id) router.push(`/admin/blog-posts/${data.id}`)
      },
      onError: error => {
        toast.error(error.message)
      },
    }),
  )

  const onSubmit = form.handleSubmit(data => {
    mutation.mutate(data)
  })

  useHotkeys([["mod+enter", () => void onSubmit()]], [], true)

  useComputedField({
    form,
    sourceField: "title",
    computedField: "slug",
    callback: slugify,
    enabled: !post,
  })

  return (
    <Form {...form}>
      <Stack className="justify-between">
        <H3 className="flex-1 truncate">{title}</H3>
        <Button type="button" variant="secondary" size="sm" asChild>
          <Link href="/admin/blog-posts">Back to list</Link>
        </Button>
      </Stack>

      <form onSubmit={onSubmit} className={cx("grid gap-4 @lg:grid-cols-2", className)} noValidate {...props}>
        <Controller
          control={form.control}
          name="title"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="@lg:col-span-2">
              <FieldLabel data-required htmlFor={field.name}>
                Title
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
            <Field data-invalid={fieldState.invalid}>
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
          name="authorId"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Author</FieldLabel>
              <Select
                value={field.value ?? "__none__"}
                onValueChange={v => field.onChange(v === "__none__" ? null : v)}
              >
                <SelectTrigger id={field.name}>
                  <SelectValue placeholder="Optional" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {authors.map(a => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="publishedAt"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="@lg:col-span-2">
              <FieldLabel htmlFor={field.name}>Published at</FieldLabel>
              <Input
                id={field.name}
                type="datetime-local"
                value={field.value instanceof Date ? toLocalDatetimeValue(field.value) : ""}
                onChange={e => {
                  const v = e.target.value
                  field.onChange(v ? new Date(v) : null)
                }}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="excerpt"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="@lg:col-span-2">
              <FieldLabel htmlFor={field.name}>Excerpt</FieldLabel>
              <TextArea id={field.name} {...field} value={field.value ?? ""} rows={3} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="content"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="@lg:col-span-2">
              <FieldLabel htmlFor={field.name}>Content (Markdown)</FieldLabel>
              <TextArea id={field.name} {...field} value={field.value ?? ""} rows={16} className="font-mono text-sm" />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="heroImageUrl"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="@lg:col-span-2">
              <FieldLabel htmlFor={field.name}>Hero image URL</FieldLabel>
              <Input {...field} id={field.name} value={field.value ?? ""} />
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

        <H3 className="@lg:col-span-2 text-base font-semibold border-t border-border pt-6 mt-2">
          SEO and AIO
        </H3>

        <Controller
          control={form.control}
          name="canonicalUrl"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="@lg:col-span-2">
              <FieldLabel htmlFor={field.name}>Canonical URL</FieldLabel>
              <Note className="text-xs mb-1">Optional absolute URL, same site only. Leave empty for default.</Note>
              <Input {...field} id={field.name} value={field.value ?? ""} placeholder="https://…" />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="ogImageUrl"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="@lg:col-span-2">
              <FieldLabel htmlFor={field.name}>Open Graph image URL</FieldLabel>
              <Input {...field} id={field.name} value={field.value ?? ""} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="ogImageAlt"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="@lg:col-span-2">
              <FieldLabel htmlFor={field.name}>Hero / OG image alt text</FieldLabel>
              <Input {...field} id={field.name} value={field.value ?? ""} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="metaRobots"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="@lg:col-span-2">
              <FieldLabel htmlFor={field.name}>Meta robots</FieldLabel>
              <Note className="text-xs mb-1">When set on published posts, overrides default indexing hints.</Note>
              <Input {...field} id={field.name} value={field.value ?? ""} placeholder="index,follow" />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="focusKeyword"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="@lg:col-span-2">
              <FieldLabel htmlFor={field.name}>Focus keyword</FieldLabel>
              <Input {...field} id={field.name} value={field.value ?? ""} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="contentType"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="@lg:col-span-2">
              <FieldLabel htmlFor={field.name}>Content type</FieldLabel>
              <Select
                value={field.value ? field.value : "__none__"}
                onValueChange={v => field.onChange(v === "__none__" ? "" : v)}
              >
                <SelectTrigger id={field.name}>
                  <SelectValue placeholder="Optional" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {articleContentTypes.map(ct => (
                    <SelectItem key={ct} value={ct}>
                      {ct}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="readingTimeMinutes"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="@lg:col-span-2">
              <FieldLabel htmlFor={field.name}>Reading time (minutes)</FieldLabel>
              <Note className="text-xs mb-1">Leave empty to auto-estimate from content on save.</Note>
              <Input
                id={field.name}
                type="number"
                min={1}
                max={999}
                value={field.value == null ? "" : field.value}
                onChange={e => {
                  const v = e.target.value
                  if (v === "") {
                    field.onChange(null)
                    return
                  }
                  const n = Number.parseInt(v, 10)
                  field.onChange(Number.isNaN(n) ? null : n)
                }}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="lastReviewedAt"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="@lg:col-span-2">
              <FieldLabel htmlFor={field.name}>Last reviewed at</FieldLabel>
              <Input
                id={field.name}
                type="datetime-local"
                value={field.value instanceof Date ? toLocalDatetimeValue(field.value) : ""}
                onChange={e => {
                  const v = e.target.value
                  field.onChange(v ? new Date(v) : null)
                }}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="reviewedBy"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="@lg:col-span-2">
              <FieldLabel htmlFor={field.name}>Reviewed by</FieldLabel>
              <Input {...field} id={field.name} value={field.value ?? ""} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="secondaryKeywordsJson"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="@lg:col-span-2">
              <FieldLabel htmlFor={field.name}>Secondary keywords (JSON array)</FieldLabel>
              <Note className="text-xs mb-1">Example: [&quot;impact investing&quot;, &quot;ESG&quot;]</Note>
              <TextArea id={field.name} {...field} value={field.value ?? ""} rows={3} className="font-mono text-sm" />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="keyTakeawaysJson"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="@lg:col-span-2">
              <FieldLabel htmlFor={field.name}>Key takeaways (JSON array of strings)</FieldLabel>
              <Note className="text-xs mb-1">Example: [&quot;Point one&quot;, &quot;Point two&quot;]</Note>
              <TextArea id={field.name} {...field} value={field.value ?? ""} rows={4} className="font-mono text-sm" />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="sourcesJson"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="@lg:col-span-2">
              <FieldLabel htmlFor={field.name}>Sources (JSON array)</FieldLabel>
              <Note className="text-xs mb-1">
                {`Example: [{"title":"Report","url":"https://…","publisher":"UN","publishedAt":"2024"}]`}
              </Note>
              <TextArea id={field.name} {...field} value={field.value ?? ""} rows={5} className="font-mono text-sm" />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="faqItemsJson"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="@lg:col-span-2">
              <FieldLabel htmlFor={field.name}>FAQ items (JSON array)</FieldLabel>
              <Note className="text-xs mb-1">{`Example: [{"question":"…?","answer":"…"}]`}</Note>
              <TextArea id={field.name} {...field} value={field.value ?? ""} rows={6} className="font-mono text-sm" />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <div className="@lg:col-span-2 flex gap-2">
          <Button type="submit" variant="primary" disabled={mutation.isPending}>
            Save
          </Button>
        </div>
      </form>
    </Form>
  )
}
