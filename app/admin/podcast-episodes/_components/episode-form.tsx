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
import { episodeProfileHref } from "~/lib/podcast-links"
import { orpc } from "~/lib/orpc-query"
import { cx } from "~/lib/utils"
import { findPodcastEpisode } from "~/server/admin/podcast-episodes/queries"
import {
  type PodcastEpisodeFormValues,
  podcastEpisodeFormSchema,
} from "~/server/admin/podcast-episodes/schema"

function toLocalDatetimeValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function showToForm(show: string | null): "dfg" | "iip" | "generic" {
  if (show === "dfg") return "dfg"
  if (show === "iip") return "iip"
  return "generic"
}

type EpisodeFormProps = ComponentProps<"form"> & {
  episode?: NonNullable<Awaited<ReturnType<typeof findPodcastEpisode>>>
  title: string
}

export function EpisodeForm({ className, title, episode, ...props }: EpisodeFormProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const isEdit = !!episode

  const form = useForm<PodcastEpisodeFormValues, unknown, PodcastEpisodeFormValues>({
    resolver: zodResolver(podcastEpisodeFormSchema),
    values: isEdit
      ? {
          id: episode.id,
          title: episode.title,
          slug: episode.slug,
          status: episode.status,
          show: showToForm(episode.show),
          episodeNumber: episode.episodeNumber ?? null,
          description: episode.description ?? "",
          content: episode.content ?? "",
          excerpt: episode.excerpt ?? "",
          heroImageUrl: episode.heroImageUrl ?? "",
          spotifyUrl: episode.spotifyUrl ?? "",
          appleUrl: episode.appleUrl ?? "",
          youtubeUrl: episode.youtubeUrl ?? "",
          guestName: episode.guestName ?? "",
          guestTitle: episode.guestTitle ?? "",
          guestCompany: episode.guestCompany ?? "",
          seoTitle: episode.seoTitle ?? "",
          seoDescription: episode.seoDescription ?? "",
          publishedAt: episode.publishedAt ?? null,
        }
      : {
          title: "",
          slug: "",
          status: "draft",
          show: "generic",
          episodeNumber: null,
          description: "",
          content: "",
          excerpt: "",
          heroImageUrl: "",
          spotifyUrl: "",
          appleUrl: "",
          youtubeUrl: "",
          guestName: "",
          guestTitle: "",
          guestCompany: "",
          seoTitle: "",
          seoDescription: "",
          publishedAt: null,
        },
  })

  const createMutation = useMutation(
    orpc.admin.podcastEpisodes.create.mutationOptions({
      onSuccess: data => {
        toast.success("Podcast episode created")
        void queryClient.invalidateQueries({ queryKey: orpc.admin.podcastEpisodes.key() })
        if (data?.id) router.push(`/admin/podcast-episodes/${data.id}`)
      },
      onError: error => toast.error(error.message),
    }),
  )

  const updateMutation = useMutation(
    orpc.admin.podcastEpisodes.update.mutationOptions({
      onSuccess: () => {
        toast.success("Podcast episode updated")
        void queryClient.invalidateQueries({ queryKey: orpc.admin.podcastEpisodes.key() })
      },
      onError: error => toast.error(error.message),
    }),
  )

  const pending = createMutation.isPending || updateMutation.isPending

  const runSave = (values: PodcastEpisodeFormValues) => {
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
    if (!form.getValues("publishedAt")) {
      form.setValue("publishedAt", new Date())
    }
    void form.handleSubmit(runSave)()
  }

  useHotkeys([["mod+enter", () => void onSubmit()]], [], true)

  useComputedField({
    form,
    sourceField: "title",
    computedField: "slug",
    callback: slugify,
    enabled: !episode,
  })

  const viewHref =
    episode?.status === "published"
      ? episodeProfileHref({ show: episode.show, slug: episode.slug })
      : null

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
            <Link href="/admin/podcast-episodes">Back to list</Link>
          </Button>
        </div>
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
          name="show"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Show</FieldLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id={field.name}>
                  <SelectValue placeholder="Show" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dfg">Disruptors for Good (dfg)</SelectItem>
                  <SelectItem value="iip">Investing in Impact (iip)</SelectItem>
                  <SelectItem value="generic">Generic</SelectItem>
                </SelectContent>
              </Select>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="episodeNumber"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Episode number</FieldLabel>
              <Input
                id={field.name}
                type="number"
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
          name="description"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="@lg:col-span-2">
              <FieldLabel htmlFor={field.name}>Description</FieldLabel>
              <TextArea id={field.name} {...field} value={field.value ?? ""} rows={3} />
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
              <FieldLabel htmlFor={field.name}>Content</FieldLabel>
              <TextArea id={field.name} {...field} value={field.value ?? ""} rows={12} className="font-mono text-sm" />
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
          name="spotifyUrl"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="@lg:col-span-2">
              <FieldLabel htmlFor={field.name}>Spotify URL</FieldLabel>
              <Input {...field} id={field.name} value={field.value ?? ""} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="appleUrl"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="@lg:col-span-2">
              <FieldLabel htmlFor={field.name}>Apple URL</FieldLabel>
              <Input {...field} id={field.name} value={field.value ?? ""} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="youtubeUrl"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="@lg:col-span-2">
              <FieldLabel htmlFor={field.name}>YouTube URL</FieldLabel>
              <Input {...field} id={field.name} value={field.value ?? ""} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="guestName"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Guest name</FieldLabel>
              <Input {...field} id={field.name} value={field.value ?? ""} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="guestTitle"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Guest title</FieldLabel>
              <Input {...field} id={field.name} value={field.value ?? ""} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="guestCompany"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="@lg:col-span-2">
              <FieldLabel htmlFor={field.name}>Guest company</FieldLabel>
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
