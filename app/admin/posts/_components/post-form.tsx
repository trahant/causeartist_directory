"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useHotkeys } from "@mantine/hooks"
import { createId } from "@paralleldrive/cuid2"
import { formatDateTime, isValidImageSrc, slugify } from "@primoui/utils"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { Editor } from "@tiptap/react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { type ComponentProps, useCallback, useMemo, useRef, useState } from "react"
import { Controller, FormProvider as Form, useForm } from "react-hook-form"
import { toast } from "sonner"
import { PostStatus } from "~/.generated/prisma/browser"
import { PostActions } from "~/app/admin/posts/_components/post-actions"
import { PostPublishActions } from "~/app/admin/posts/_components/post-publish-actions"
import { TiptapEditor } from "~/components/admin/tiptap/tiptap-editor"
import { Button } from "~/components/common/button"
import { Field, FieldError, FieldLabel } from "~/components/common/field"
import { FormMedia } from "~/components/common/form-media"
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
import { siteConfig } from "~/config/site"
import { useComputedField } from "~/hooks/use-computed-field"
import { orpc } from "~/lib/orpc-query"
import { cx } from "~/lib/utils"
import type { findPostById } from "~/server/admin/posts/queries"
import { postSchema } from "~/server/admin/posts/schema"

type PostFormProps = ComponentProps<"form"> & {
  post?: NonNullable<Awaited<ReturnType<typeof findPostById>>>
  currentUserId?: string
}

export const PostForm = ({ className, title, post, currentUserId, ...props }: PostFormProps) => {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data: users = [] } = useQuery(orpc.admin.users.lookup.queryOptions())
  const [isStatusPending, setIsStatusPending] = useState(false)
  const originalStatus = useRef(post?.status ?? PostStatus.Draft)
  const id = useMemo(() => post?.id ?? createId(), [post?.id])

  const form = useForm({
    resolver: zodResolver(postSchema),
    values: {
      id,
      title: post?.title ?? "",
      slug: post?.slug ?? "",
      description: post?.description ?? "",
      content: post?.content ?? "",
      plainText: post?.plainText ?? "",
      imageUrl: post?.imageUrl ?? "",
      status: post?.status ?? PostStatus.Draft,
      publishedAt: post?.publishedAt ?? undefined,
      authorId: post?.authorId ?? currentUserId ?? "",
    },
  })

  const mutation = useMutation(
    orpc.admin.posts.upsert.mutationOptions({
      onSuccess: data => {
        if (data.status !== originalStatus.current) {
          toast.success(
            <>
              Post is now {data.status.toLowerCase()}.{" "}
              {data.status === "Scheduled" && data.publishedAt && (
                <>Will be published on {formatDateTime(data.publishedAt, "long")}.</>
              )}
            </>,
          )
          originalStatus.current = data.status
        } else {
          toast.success(`Post successfully ${post ? "updated" : "created"}`)
        }

        queryClient.invalidateQueries({ queryKey: orpc.admin.posts.key() })
        router.push(`/admin/posts/${data.id}`)
      },

      onError: error => {
        toast.error(error.message)
      },

      onSettled: () => {
        setIsStatusPending(false)
      },
    }),
  )

  useHotkeys([["mod+enter", () => form.handleSubmit(data => mutation.mutate(data))()]], [], true)

  // Set the slug based on the title
  useComputedField({
    form,
    sourceField: "title",
    computedField: "slug",
    callback: slugify,
    enabled: !post,
  })

  // Stable media path based on immutable post ID
  const path = `posts/${id}`

  // Handle editor updates: extract content, readTime, and plain text
  const handleEditorUpdate = useCallback(
    (editor: Editor) => {
      form.setValue("content", editor.getMarkdown())
      form.setValue("plainText", editor.getText())
    },
    [form],
  )

  // Handle form submission
  const handleSubmit = form.handleSubmit((data, event) => {
    const submitter = (event?.nativeEvent as SubmitEvent)?.submitter
    const isStatusChange = submitter?.getAttribute("name") !== "submit"

    if (isStatusChange) {
      setIsStatusPending(true)
    }

    mutation.mutate(data)
  })

  // Handle status change
  const handleStatusSubmit = (status: PostStatus, publishedAt: Date | null) => {
    form.setValue("status", status)
    form.setValue("publishedAt", publishedAt)
    handleSubmit()
  }

  return (
    <Form {...form}>
      <Stack className="justify-between">
        <H3 className="flex-1 truncate">{title}</H3>

        <Stack size="sm" className="-my-0.5">
          {post && <PostActions post={post} size="md" />}
        </Stack>

        {post && (
          <Note className="w-full">
            <Link href={`/blog/${post.slug}`} target="_blank" className="text-primary underline">
              {siteConfig.url}/blog/{post.slug}
            </Link>

            {post.status === PostStatus.Published && post.publishedAt && (
              <>
                <br />
                Published on{" "}
                <strong className="text-foreground">{formatDateTime(post.publishedAt)}</strong>
              </>
            )}

            {post.status === PostStatus.Scheduled && post.publishedAt && (
              <>
                <br />
                Scheduled to be published on{" "}
                <strong className="text-foreground">{formatDateTime(post.publishedAt)}</strong>
              </>
            )}
          </Note>
        )}
      </Stack>

      <form
        onSubmit={handleSubmit}
        className={cx("grid gap-4 @lg:grid-cols-2", className)}
        noValidate
        {...props}
      >
        <Controller
          control={form.control}
          name="title"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel data-required htmlFor={field.name}>
                Title
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
              <FieldLabel htmlFor={field.name}>Slug</FieldLabel>
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
              <Stack className="w-full justify-between">
                <FieldLabel htmlFor={field.name}>Description</FieldLabel>
                <Note className="text-xs">Max. 160 chars</Note>
              </Stack>
              <TextArea id={field.name} {...field} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="authorId"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel data-required htmlFor={field.name}>
                Author
              </FieldLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id={field.name}>
                  <SelectValue placeholder="Select author" />
                </SelectTrigger>
                <SelectContent>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
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
          name="imageUrl"
          render={({ field }) => (
            <FormMedia form={form} field={field} path={`${path}/image`}>
              {isValidImageSrc(field.value) && (
                <Image
                  src={field.value}
                  alt="Featured image"
                  height={72}
                  width={128}
                  className="h-8 w-auto border box-content rounded-md aspect-video object-cover"
                />
              )}
            </FormMedia>
          )}
        />

        <Controller
          control={form.control}
          name="content"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="col-span-full items-stretch">
              <FieldLabel>Content</FieldLabel>
              <TiptapEditor value={field.value} onUpdate={handleEditorUpdate} mediaPath={path} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <div className="flex justify-between gap-4 col-span-full">
          <Button size="md" variant="secondary" asChild>
            <Link href="/admin/posts">Cancel</Link>
          </Button>

          <PostPublishActions
            postStatus={post?.status ?? PostStatus.Draft}
            publishedAt={post?.publishedAt ?? null}
            isPending={!isStatusPending && mutation.isPending}
            isStatusPending={isStatusPending}
            onStatusSubmit={handleStatusSubmit}
          />
        </div>
      </form>
    </Form>
  )
}
