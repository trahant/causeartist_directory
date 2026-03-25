"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useHotkeys } from "@mantine/hooks"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { ComponentProps } from "react"
import { Controller, FormProvider as Form, useForm } from "react-hook-form"
import { toast } from "sonner"
import { HeroImageUrlField } from "~/components/admin/hero-image-url-field"
import { Button } from "~/components/common/button"
import { Field, FieldError, FieldLabel } from "~/components/common/field"
import { H3 } from "~/components/common/heading"
import { Input } from "~/components/common/input"
import { Kbd } from "~/components/common/kbd"
import { Link } from "~/components/common/link"
import { RelationSelector } from "~/components/common/relation-selector"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/common/select"
import { Stack } from "~/components/common/stack"
import { TextArea } from "~/components/common/textarea"
import { orpc } from "~/lib/orpc-query"
import { cx } from "~/lib/utils"
import type { findFunderByIdForAdmin, findTaxonomyForFunderAdmin } from "~/server/admin/funders/queries"
import { funderUpdateSchema } from "~/server/admin/funders/schema"

const FUNDER_TYPES = [
  "vc",
  "foundation",
  "accelerator",
  "family-office",
  "cdfi",
  "impact-fund",
  "fellowship",
  "corporate",
] as const

function keyBenefitsToString(v: unknown): string {
  if (v == null) return ""
  if (typeof v === "string") return v
  try {
    return JSON.stringify(v, null, 2)
  } catch {
    return ""
  }
}

type FunderFormProps = ComponentProps<"form"> & {
  funder: NonNullable<Awaited<ReturnType<typeof findFunderByIdForAdmin>>>
  taxonomy: Awaited<ReturnType<typeof findTaxonomyForFunderAdmin>>
}

export function FunderForm({ className, title, funder, taxonomy, ...props }: FunderFormProps) {
  const queryClient = useQueryClient()

  const form = useForm({
    resolver: zodResolver(funderUpdateSchema),
    values: {
      id: funder.id,
      name: funder.name,
      slug: funder.slug,
      status: funder.status as "draft" | "published",
      type: funder.type ?? "",
      description: funder.description ?? "",
      logoUrl: funder.logoUrl ?? "",
      website: funder.website ?? "",
      foundedYear: funder.foundedYear ?? null,
      aum: funder.aum ?? "",
      checkSizeMin: funder.checkSizeMin ?? null,
      checkSizeMax: funder.checkSizeMax ?? null,
      investmentThesis: funder.investmentThesis ?? "",
      applicationUrl: funder.applicationUrl ?? "",
      linkedin: funder.linkedin ?? "",
      seoTitle: funder.seoTitle ?? "",
      seoDescription: funder.seoDescription ?? "",
      heroImageUrl: funder.heroImageUrl ?? "",
      keyBenefitsJson: keyBenefitsToString(funder.keyBenefits),
      sectorIds: funder.sectors.map(s => s.sectorId),
      locationIds: funder.locations.map(l => l.locationId),
      subcategoryIds: funder.subcategories.map(s => s.subcategoryId),
      companyIds: funder.portfolio.map(c => c.companyId),
      stageIds: funder.stages.map(s => s.stageId),
    },
  })

  const mutation = useMutation(
    orpc.admin.funders.update.mutationOptions({
      onSuccess: () => {
        toast.success("Funder updated")
        void queryClient.invalidateQueries({ queryKey: orpc.admin.funders.key() })
      },
      onError: error => {
        toast.error(error.message)
      },
    }),
  )

  const onSubmit = form.handleSubmit(data => mutation.mutate(data))

  useHotkeys([["mod+enter", () => onSubmit()]], [], true)

  return (
    <Form {...form}>
      <Stack className="justify-between">
        <H3 className="flex-1 truncate">{title}</H3>
        <Button variant="secondary" size="sm" asChild>
          <Link href={`/funders/${funder.slug}`} target="_blank" rel="noreferrer">
            View profile
          </Link>
        </Button>
      </Stack>

      <form
        onSubmit={onSubmit}
        className={cx("grid gap-4 @lg:grid-cols-2", className)}
        noValidate
        {...props}
      >
        <div className="grid gap-4 @lg:grid-cols-2 col-span-full">
          <Controller
            control={form.control}
            name="name"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Name</FieldLabel>
                <Input id={field.name} {...field} />
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
        </div>

        <Controller
          control={form.control}
          name="status"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Status</FieldLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue />
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
          name="type"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Funder type</FieldLabel>
              <Select value={field.value || "__empty"} onValueChange={v => field.onChange(v === "__empty" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__empty">(none)</SelectItem>
                  {FUNDER_TYPES.map(t => (
                    <SelectItem key={t} value={t}>
                      {t}
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
          name="description"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="col-span-full">
              <FieldLabel htmlFor={field.name}>Description</FieldLabel>
              <TextArea id={field.name} {...field} value={field.value ?? ""} rows={6} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <div className="grid gap-4 @lg:grid-cols-2 col-span-full">
          <Controller
            control={form.control}
            name="website"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Website</FieldLabel>
                <Input id={field.name} {...field} value={field.value ?? ""} />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="logoUrl"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Logo URL</FieldLabel>
                <Input id={field.name} {...field} value={field.value ?? ""} />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </div>

        <Controller
          control={form.control}
          name="linkedin"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="col-span-full">
              <FieldLabel htmlFor={field.name}>LinkedIn</FieldLabel>
              <Input id={field.name} {...field} value={field.value ?? ""} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <div className="grid gap-4 @lg:grid-cols-2 col-span-full">
          <Controller
            control={form.control}
            name="foundedYear"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Founded year</FieldLabel>
                <Input
                  id={field.name}
                  type="number"
                  name={field.name}
                  ref={field.ref}
                  onBlur={field.onBlur}
                  value={
                    field.value == null || field.value === ""
                      ? ""
                      : (field.value as number | string)
                  }
                  onChange={e => {
                    const v = e.target.value
                    field.onChange(v === "" ? null : Number.parseInt(v, 10))
                  }}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="aum"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>AUM</FieldLabel>
                <Input id={field.name} {...field} value={field.value ?? ""} />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </div>

        <div className="grid gap-4 @lg:grid-cols-2 col-span-full">
          <Controller
            control={form.control}
            name="checkSizeMin"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Check size min (USD)</FieldLabel>
                <Input
                  id={field.name}
                  type="number"
                  name={field.name}
                  ref={field.ref}
                  onBlur={field.onBlur}
                  value={
                    field.value == null || field.value === ""
                      ? ""
                      : (field.value as number | string)
                  }
                  onChange={e => {
                    const v = e.target.value
                    field.onChange(v === "" ? null : Number.parseInt(v, 10))
                  }}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="checkSizeMax"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Check size max (USD)</FieldLabel>
                <Input
                  id={field.name}
                  type="number"
                  name={field.name}
                  ref={field.ref}
                  onBlur={field.onBlur}
                  value={
                    field.value == null || field.value === ""
                      ? ""
                      : (field.value as number | string)
                  }
                  onChange={e => {
                    const v = e.target.value
                    field.onChange(v === "" ? null : Number.parseInt(v, 10))
                  }}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </div>

        <Controller
          control={form.control}
          name="investmentThesis"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="col-span-full">
              <FieldLabel htmlFor={field.name}>Investment thesis</FieldLabel>
              <TextArea id={field.name} {...field} value={field.value ?? ""} rows={6} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="applicationUrl"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="col-span-full">
              <FieldLabel htmlFor={field.name}>Application URL</FieldLabel>
              <Input id={field.name} {...field} value={field.value ?? ""} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <div className="grid gap-4 @lg:grid-cols-2 col-span-full">
          <Controller
            control={form.control}
            name="seoTitle"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>SEO title</FieldLabel>
                <Input id={field.name} {...field} value={field.value ?? ""} />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="seoDescription"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>SEO description</FieldLabel>
                <Input id={field.name} {...field} value={field.value ?? ""} />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </div>

        <Controller
          control={form.control}
          name="heroImageUrl"
          render={({ field, fieldState }) => (
            <HeroImageUrlField
              field={field}
              fieldState={fieldState}
              uploadKeyPrefix={`funders/${funder.id}/hero`}
            />
          )}
        />

        <Controller
          control={form.control}
          name="keyBenefitsJson"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="col-span-full">
              <FieldLabel htmlFor={field.name}>Key benefits (JSON array)</FieldLabel>
              <TextArea
                id={field.name}
                {...field}
                value={field.value ?? ""}
                rows={4}
                className="font-mono text-sm"
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="sectorIds"
          render={({ field }) => (
            <Field className="col-span-full">
              <FieldLabel>Sectors</FieldLabel>
              <RelationSelector relations={taxonomy.sectors} ids={field.value ?? []} setIds={field.onChange} />
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="locationIds"
          render={({ field }) => (
            <Field className="col-span-full">
              <FieldLabel>Locations</FieldLabel>
              <RelationSelector
                relations={taxonomy.locations}
                ids={field.value ?? []}
                setIds={field.onChange}
              />
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="subcategoryIds"
          render={({ field }) => (
            <Field className="col-span-full">
              <FieldLabel>Focus areas (subcategories)</FieldLabel>
              <RelationSelector
                relations={taxonomy.subcategories}
                ids={field.value ?? []}
                setIds={field.onChange}
              />
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="companyIds"
          render={({ field }) => (
            <Field className="col-span-full">
              <FieldLabel>Companies</FieldLabel>
              <RelationSelector
                relations={taxonomy.companies}
                ids={field.value ?? []}
                setIds={field.onChange}
              />
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="stageIds"
          render={({ field }) => (
            <Field className="col-span-full">
              <FieldLabel>Investment stages</FieldLabel>
              <RelationSelector
                relations={taxonomy.fundingStages}
                ids={field.value ?? []}
                setIds={field.onChange}
              />
            </Field>
          )}
        />

        <div className="flex justify-between gap-4 col-span-full">
          <Button size="md" variant="secondary" asChild>
            <Link href="/admin/funders">Back to list</Link>
          </Button>
          <Button
            size="md"
            isPending={mutation.isPending}
            suffix={<Kbd variant="outline" keys={["meta", "enter"]} />}
          >
            Save funder
          </Button>
        </div>
      </form>
    </Form>
  )
}
