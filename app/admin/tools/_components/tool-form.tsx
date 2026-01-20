"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useHookFormAction } from "@next-safe-action/adapter-react-hook-form/hooks"
import { formatDateTime, getRandomString, slugify } from "@primoui/utils"
import { EyeIcon, InfoIcon, PencilIcon } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { type ComponentProps, use, useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import { type Tool, ToolStatus } from "~/.generated/prisma/browser"
import { ToolActions } from "~/app/admin/tools/_components/tool-actions"
import { ToolPublishActions } from "~/app/admin/tools/_components/tool-publish-actions"
import { AIGenerateContent } from "~/components/admin/ai/generate-content"
import { AIRelationSuggestions } from "~/components/admin/ai/relation-suggestions"
import { Button } from "~/components/common/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/common/form"
import { FormMedia } from "~/components/common/form-media"
import { H3 } from "~/components/common/heading"
import { Input, inputVariants } from "~/components/common/input"
import { Link } from "~/components/common/link"
import { Note } from "~/components/common/note"
import { Stack } from "~/components/common/stack"
import { Switch } from "~/components/common/switch"
import { TextArea } from "~/components/common/textarea"
import { Tooltip } from "~/components/common/tooltip"
import { Markdown } from "~/components/web/markdown"
import { siteConfig } from "~/config/site"
import { useComputedField } from "~/hooks/use-computed-field"
import { isToolPublished } from "~/lib/tools"
import { cx } from "~/lib/utils"
import type { findCategoryList } from "~/server/admin/categories/queries"
import { contentSchema } from "~/server/admin/shared/schema"
import type { findTagList } from "~/server/admin/tags/queries"
import { upsertTool } from "~/server/admin/tools/actions"
import type { findToolBySlug } from "~/server/admin/tools/queries"
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
  tool?: NonNullable<Awaited<ReturnType<typeof findToolBySlug>>>
  categoriesPromise: ReturnType<typeof findCategoryList>
  tagsPromise: ReturnType<typeof findTagList>
}

export function ToolForm({
  children,
  className,
  title,
  tool,
  categoriesPromise,
  tagsPromise,
  ...props
}: ToolFormProps) {
  const router = useRouter()
  const categories = use(categoriesPromise)
  const tags = use(tagsPromise)
  const resolver = zodResolver(toolSchema)
  const [isPreviewing, setIsPreviewing] = useState(false)
  const [isStatusPending, setIsStatusPending] = useState(false)
  const [isGenerationComplete, setIsGenerationComplete] = useState(true)
  const originalStatus = useRef(tool?.status ?? ToolStatus.Draft)

  const { form, action } = useHookFormAction(upsertTool, resolver, {
    formProps: {
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
        isFeatured: tool?.isFeatured ?? false,
        submitterName: tool?.submitterName ?? "",
        submitterEmail: tool?.submitterEmail ?? "",
        submitterNote: tool?.submitterNote ?? "",
        status: tool?.status ?? ToolStatus.Draft,
        publishedAt: tool?.publishedAt ?? undefined,
        categories: tool?.categories.map(c => c.id) ?? [],
        tags: tool?.tags.map(t => t.id) ?? [],
        notifySubmitter: true,
      },
    },

    actionProps: {
      onSuccess: ({ data }) => {
        if (!data) return

        if (data.status !== originalStatus.current) {
          toast.success(<ToolStatusChange tool={data} />)
          originalStatus.current = data.status
        } else {
          toast.success(`Tool successfully ${tool ? "updated" : "created"}`)
        }

        // Redirect to the new tool
        router.push(`/admin/tools/${data.id}`)
      },

      onError: ({ error }) => {
        toast.error(error.serverError)
      },

      onSettled: () => {
        setIsStatusPending(false)
      },
    },
  })

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

    action.execute(data)
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
            {isToolPublished(tool) ? "View:" : "Preview:"}{" "}
            <Link href={`/${tool.slug}`} target="_blank" className="text-primary underline">
              {siteConfig.url}/{tool.slug}
            </Link>
            {tool.status === ToolStatus.Scheduled && tool.publishedAt && (
              <>
                <br />
                Scheduled to be published on{" "}
                <strong className="text-foreground">{formatDateTime(tool.publishedAt)}</strong>
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

        <FormField
          control={form.control}
          name="websiteUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel isRequired>Website URL</FormLabel>
              <FormControl>
                <Input type="url" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="affiliateUrl"
          render={({ field }) => (
            <FormItem>
              <Stack className="w-full justify-between">
                <FormLabel>Affiliate URL</FormLabel>

                <Tooltip tooltip="If you have an affiliate link, you can enter it here. This will be displayed on the tool page.">
                  <InfoIcon className="cursor-help opacity-50" />
                </Tooltip>
              </Stack>

              <FormControl>
                <Input type="url" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tagline"
          render={({ field }) => (
            <FormItem className="col-span-full">
              <Stack className="w-full justify-between">
                <FormLabel>Tagline</FormLabel>
                <Note className="text-xs">Max. 60 chars</Note>
              </Stack>

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
              <Stack className="w-full justify-between">
                <FormLabel>Description</FormLabel>
                <Note className="text-xs">Max. 160 chars</Note>
              </Stack>
              <FormControl>
                <TextArea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem className="col-span-full items-stretch">
              <Stack className="justify-between">
                <FormLabel>Content</FormLabel>

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

              <FormControl>
                {field.value && isPreviewing ? (
                  <Markdown
                    code={field.value}
                    className={cx(
                      inputVariants(),
                      "max-w-none min-h-18 bg-card border leading-normal",
                    )}
                  />
                ) : (
                  <TextArea className="min-h-18" {...field} />
                )}
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {tool?.submitterEmail && (
          <>
            <FormField
              control={form.control}
              name="submitterName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Submitter Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="submitterEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Submitter Email</FormLabel>
                  <FormControl>
                    <Input type="email" data-1p-ignore {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="submitterNote"
              render={({ field }) => (
                <FormItem className="col-span-full">
                  <FormLabel>Submitter Note</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        <FormField
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
                  unoptimized
                />
              )}
            </FormMedia>
          )}
        />

        <FormField
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
                  unoptimized
                  className="h-8 w-auto border box-content rounded-md aspect-video object-cover"
                />
              )}
            </FormMedia>
          )}
        />

        <FormField
          control={form.control}
          name="categories"
          render={({ field }) => (
            <FormItem className="col-span-full">
              <FormLabel>Categories</FormLabel>
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
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tags"
          render={({ field }) => (
            <FormItem className="col-span-full">
              <FormLabel>Tags</FormLabel>
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
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isFeatured"
          render={({ field }) => (
            <FormItem direction="row">
              <FormControl>
                <Switch onCheckedChange={field.onChange} checked={field.value} />
              </FormControl>
              <FormLabel>Feature this tool</FormLabel>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-between gap-4 col-span-full">
          <Button size="md" variant="secondary" asChild>
            <Link href="/admin/tools">Cancel</Link>
          </Button>

          <ToolPublishActions
            tool={tool}
            isPending={!isStatusPending && action.isPending}
            isStatusPending={isStatusPending}
            onStatusSubmit={handleStatusSubmit}
          />
        </div>
      </form>
    </Form>
  )
}
