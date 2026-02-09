"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useHotkeys } from "@mantine/hooks"
import { formatDateTime, getRandomString, slugify } from "@primoui/utils"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { EyeIcon, InfoIcon, PencilIcon } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import React, { type ComponentProps, useMemo, useRef, useState } from "react"
import { Controller, FormProvider as Form, useForm } from "react-hook-form"
import { toast } from "sonner"
import { type Tool, ToolStatus, ToolTier } from "~/.generated/prisma/browser"
import { ToolActions } from "~/app/admin/tools/_components/tool-actions"
import { ToolPublishActions } from "~/app/admin/tools/_components/tool-publish-actions"
import { AIGenerateContent } from "~/components/admin/ai/generate-content"
import { AIRelationSuggestions } from "~/components/admin/ai/relation-suggestions"
import { Button } from "~/components/common/button"
import { Field, FieldError, FieldLabel } from "~/components/common/field"
import { FormMedia } from "~/components/common/form-media"
import { H3 } from "~/components/common/heading"
import { Input, inputVariants } from "~/components/common/input"
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
import { Tooltip } from "~/components/common/tooltip"
import { Markdown } from "~/components/web/markdown"
import { siteConfig } from "~/config/site"
import { useComputedField } from "~/hooks/use-computed-field"
import { isToolApproved } from "~/lib/tools"
import { orpc } from "~/lib/orpc-query"
import { cx } from "~/lib/utils"
import type { findCategoryList } from "~/server/admin/categories/queries"
import { contentSchema } from "~/server/admin/shared/schema"
import type { findTagList } from "~/server/admin/tags/queries"
import type { findToolById } from "~/server/admin/tools/queries"
import { toolSchema } from "~/server/admin/tools/schema"

const ToolStatusChange = ({ tool }: { tool: Tool }) => {
  return (
    <>
      <Link href={`/${tool.slug}`} target="_blank" className="font-semibold underline inline-block">
        {tool.name}
      </Link>{" "}
      is now {tool.status.toLowerCase()}.{" "}
      {tool.status === "Scheduled" && (
        <>
          Will be published on {formatDateTime(tool.publishedAt ?? new Date(), "long")} (
          {Intl.DateTimeFormat().resolvedOptions().timeZone.replace(/^.+\//, "")}).
        </>
      )}
    </>
  )
}

type ToolFormProps = ComponentProps<"form"> & {
  tool?: NonNullable<Awaited<ReturnType<typeof findToolById>>>
  categoriesPromise: ReturnType<typeof findCategoryList>
  tagsPromise: ReturnType<typeof findTagList>
}

export function ToolForm({
  className,
  title,
  tool,
  categoriesPromise,
  tagsPromise,
  ...props
}: ToolFormProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const categories = React.use(categoriesPromise)
  const tags = React.use(tagsPromise)
  const [isPreviewing, setIsPreviewing] = useState(false)
  const [isStatusPending, setIsStatusPending] = useState(false)
  const [isGenerationComplete, setIsGenerationComplete] = useState(true)
  const originalStatus = useRef(tool?.status ?? ToolStatus.Draft)

  const form = useForm({
    resolver: zodResolver(toolSchema),
    defaultValues: {
      id: tool?.id ?? "",
      name: tool?.name ?? "",
      slug: tool?.slug ?? "",
      tagline: tool?.tagline ?? "",
      description: tool?.description ?? "",
      content: tool?.content ?? "",
      websiteUrl: tool?.websiteUrl ?? "",
      affiliateUrl: tool?.affiliateUrl ?? "",
      faviconUrl: tool?.faviconUrl ?? "",
      screenshotUrl: tool?.screenshotUrl ?? "",
      tier: tool?.tier ?? ToolTier.Free,
      submitterName: tool?.submitterName ?? "",
      submitterEmail: tool?.submitterEmail ?? "",
      submitterNote: tool?.submitterNote ?? "",
      status: tool?.status ?? ToolStatus.Draft,
      publishedAt: tool?.publishedAt ?? undefined,
      categories: tool?.categories.map(c => c.id) ?? [],
      tags: tool?.tags.map(t => t.id) ?? [],
      notifySubmitter: true,
    },
  })

  const mutation = useMutation(
    orpc.tools.upsert.mutationOptions({
      onSuccess: data => {
        if (data.status !== originalStatus.current) {
          toast.success(<ToolStatusChange tool={data} />)
          originalStatus.current = data.status
        } else {
          toast.success(`Tool successfully ${tool ? "updated" : "created"}`)
        }

        queryClient.invalidateQueries({ queryKey: orpc.tools.key() })
        router.push(`/admin/tools/${data.id}`)
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

  // Set the slug based on the name
  useComputedField({
    form,
    sourceField: "name",
    computedField: "slug",
    callback: slugify,
    enabled: !tool,
  })

  // Keep track of the form values
  const [name, slug, websiteUrl, description] = form.watch([
    "name",
    "slug",
    "websiteUrl",
    "description",
  ])

  // Store the upload path in a memoized value
  const path = useMemo(() => `tools/${slug || getRandomString(12)}`, [slug])

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
  const handleStatusSubmit = (status: ToolStatus, publishedAt: Date | null) => {
    // Update form values
    form.setValue("status", status)
    form.setValue("publishedAt", publishedAt)

    // Submit the form with updated values
    handleSubmit()
  }

  return (
    <Form {...form}>
      <Stack className="justify-between">
        <H3 className="flex-1 truncate">{title}</H3>

        <Stack size="sm" className="-my-0.5">
          <AIGenerateContent
            url={websiteUrl}
            schema={contentSchema}
            onGenerate={() => setIsGenerationComplete(false)}
            onFinish={() => setIsGenerationComplete(true)}
            onStream={object => {
              form.setValue("tagline", object.tagline)
              form.setValue("description", object.description)
              form.setValue("content", object.content)
            }}
          />

          {tool && <ToolActions tool={tool} size="md" />}
        </Stack>

        {tool && (
          <Note className="w-full">
            <Link href={`/${tool.slug}`} target="_blank" className="text-primary underline">
              {siteConfig.url}/{tool.slug}
            </Link>

            {isToolApproved(tool) && tool.publishedAt && (
              <>
                <br />
                {tool.status === ToolStatus.Scheduled
                  ? "Scheduled to be published"
                  : "Published"}{" "}
                on <strong className="text-foreground">{formatDateTime(tool.publishedAt)}</strong>
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

        <Controller
          control={form.control}
          name="websiteUrl"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel data-required htmlFor={field.name}>
                Website URL
              </FieldLabel>
              <Input id={field.name} type="url" {...field} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="affiliateUrl"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <Stack className="w-full justify-between">
                <FieldLabel htmlFor={field.name}>Affiliate URL</FieldLabel>

                <Tooltip tooltip="If you have an affiliate link, you can enter it here. This will be displayed on the tool page.">
                  <InfoIcon className="cursor-help opacity-50" />
                </Tooltip>
              </Stack>

              <Input id={field.name} type="url" {...field} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="tagline"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="col-span-full">
              <Stack className="w-full justify-between">
                <FieldLabel htmlFor={field.name}>Tagline</FieldLabel>
                <Note className="text-xs">Max. 60 chars</Note>
              </Stack>

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
          name="content"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="col-span-full items-stretch">
              <Stack className="justify-between">
                <FieldLabel htmlFor={field.name}>Content</FieldLabel>

                {field.value && (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => setIsPreviewing(prev => !prev)}
                    prefix={isPreviewing ? <PencilIcon /> : <EyeIcon />}
                    className="-my-1"
                  >
                    {isPreviewing ? "Edit" : "Preview"}
                  </Button>
                )}
              </Stack>

              {field.value && isPreviewing ? (
                <Markdown
                  code={field.value}
                  className={cx(
                    inputVariants(),
                    "max-w-none min-h-18 bg-card border leading-normal",
                  )}
                />
              ) : (
                <TextArea id={field.name} className="min-h-18" {...field} />
              )}
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {tool?.submitterEmail && (
          <>
            <Controller
              control={form.control}
              name="submitterName"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Submitter Name</FieldLabel>
                  <Input id={field.name} {...field} />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="submitterEmail"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Submitter Email</FieldLabel>
                  <Input id={field.name} type="email" data-1p-ignore {...field} />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="submitterNote"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="col-span-full">
                  <FieldLabel htmlFor={field.name}>Submitter Note</FieldLabel>
                  <Input id={field.name} {...field} />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </>
        )}

        <Controller
          control={form.control}
          name="faviconUrl"
          render={({ field }) => (
            <FormMedia
              form={form}
              field={field}
              path={`${path}/favicon`}
              fetchType="favicon"
              websiteUrl={websiteUrl}
            >
              {field.value && (
                <Image
                  src={field.value}
                  alt="Favicon"
                  width={32}
                  height={32}
                  className="size-8 border box-content rounded-md object-contain"
                />
              )}
            </FormMedia>
          )}
        />

        <Controller
          control={form.control}
          name="screenshotUrl"
          render={({ field }) => (
            <FormMedia
              form={form}
              field={field}
              path={`${path}/screenshot`}
              fetchType="screenshot"
              websiteUrl={websiteUrl}
            >
              {field.value && (
                <Image
                  src={field.value}
                  alt="Screenshot"
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
          name="categories"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="col-span-full">
              <FieldLabel>Categories</FieldLabel>
              <AIRelationSuggestions
                relations={categories}
                ids={field.value ?? []}
                setIds={field.onChange}
                prompt={
                  isGenerationComplete && name && description
                    ? `From the list of available categories below, suggest relevant categories for this link:

                    - URL: ${websiteUrl}
                    - Meta title: ${name}
                    - Meta description: ${description}.`
                    : undefined
                }
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="tags"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="col-span-full">
              <FieldLabel>Tags</FieldLabel>
              <AIRelationSuggestions
                relations={tags}
                ids={field.value ?? []}
                setIds={field.onChange}
                maxSuggestions={10}
                prompt={
                  isGenerationComplete && name && description
                    ? `From the list of available tags below, suggest relevant tags for this link:

                    - URL: ${websiteUrl}
                    - Meta title: ${name}
                    - Meta description: ${description}.`
                    : undefined
                }
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="tier"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="col-span-full">
              <FieldLabel htmlFor={field.name}>Tier</FieldLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id={field.name}>
                  <SelectValue placeholder="Select tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ToolTier.Free}>Free</SelectItem>
                  <SelectItem value={ToolTier.Standard}>Standard</SelectItem>
                  <SelectItem value={ToolTier.Premium}>Premium</SelectItem>
                </SelectContent>
              </Select>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <div className="flex justify-between gap-4 col-span-full">
          <Button size="md" variant="secondary" asChild>
            <Link href="/admin/tools">Cancel</Link>
          </Button>

          <ToolPublishActions
            tool={tool}
            isPending={!isStatusPending && mutation.isPending}
            isStatusPending={isStatusPending}
            onStatusSubmit={handleStatusSubmit}
          />
        </div>
      </form>
    </Form>
  )
}
