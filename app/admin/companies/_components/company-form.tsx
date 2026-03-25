"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useHotkeys } from "@mantine/hooks"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { PlusIcon, Trash2Icon } from "lucide-react"
import type { ComponentProps } from "react"
import { Controller, FormProvider as Form, useFieldArray, useForm } from "react-hook-form"
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
import type { findCompanyByIdForAdmin, findTaxonomyForCompanyAdmin } from "~/server/admin/companies/queries"
import { companyUpdateSchema } from "~/server/admin/companies/schema"

const emptyRetailLocation = {
  label: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  region: "",
  postalCode: "",
  countryCode: "",
  url: "",
}

function keyBenefitsToString(v: unknown): string {
  if (v == null) return ""
  if (typeof v === "string") return v
  try {
    return JSON.stringify(v, null, 2)
  } catch {
    return ""
  }
}

type CompanyFormProps = ComponentProps<"form"> & {
  company: NonNullable<Awaited<ReturnType<typeof findCompanyByIdForAdmin>>>
  taxonomy: Awaited<ReturnType<typeof findTaxonomyForCompanyAdmin>>
}

export function CompanyForm({ className, title, company, taxonomy, ...props }: CompanyFormProps) {
  const queryClient = useQueryClient()

  const form = useForm({
    resolver: zodResolver(companyUpdateSchema),
    values: {
      id: company.id,
      name: company.name,
      slug: company.slug,
      status: company.status as "draft" | "published",
      lifecycleStatus: company.lifecycleStatus,
      tagline: company.tagline ?? "",
      description: company.description ?? "",
      logoUrl: company.logoUrl ?? "",
      website: company.website ?? "",
      foundedYear: company.foundedYear ?? null,
      totalFunding: company.totalFunding ?? "",
      impactModel: company.impactModel ?? "",
      impactMetrics: company.impactMetrics ?? "",
      seoTitle: company.seoTitle ?? "",
      seoDescription: company.seoDescription ?? "",
      heroImageUrl: company.heroImageUrl ?? "",
      keyBenefitsJson: keyBenefitsToString(company.keyBenefits),
      sectorIds: company.sectors.map(s => s.sectorId),
      locationIds: company.locations.map(l => l.locationId),
      subcategoryIds: company.subcategories.map(s => s.subcategoryId),
      funderIds: company.funders.map(f => f.funderId),
      certificationIds: company.certifications.map(c => c.certificationId),
      retailLocations:
        company.retailLocations.length > 0
          ? company.retailLocations.map(r => ({
              label: r.label,
              addressLine1: r.addressLine1 ?? "",
              addressLine2: r.addressLine2 ?? "",
              city: r.city,
              region: r.region ?? "",
              postalCode: r.postalCode ?? "",
              countryCode: r.countryCode ?? "",
              url: r.url ?? "",
            }))
          : [],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "retailLocations",
  })

  const mutation = useMutation(
    orpc.admin.companies.update.mutationOptions({
      onSuccess: () => {
        toast.success("Company updated")
        void queryClient.invalidateQueries({ queryKey: orpc.admin.companies.key() })
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
          <Link href={`/companies/${company.slug}`} target="_blank" rel="noreferrer">
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

        <div className="grid gap-4 @lg:grid-cols-2 col-span-full">
          <Controller
            control={form.control}
            name="status"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>Publish status</FieldLabel>
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
            name="lifecycleStatus"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>Company lifecycle</FieldLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Acquired">Acquired</SelectItem>
                    <SelectItem value="Sunsetted">Sunsetted</SelectItem>
                  </SelectContent>
                </Select>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </div>

        <Controller
          control={form.control}
          name="tagline"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="col-span-full">
              <FieldLabel htmlFor={field.name}>Tagline</FieldLabel>
              <Input id={field.name} {...field} value={field.value ?? ""} />
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
            name="totalFunding"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Total funding</FieldLabel>
                <Input id={field.name} {...field} value={field.value ?? ""} />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </div>

        <Controller
          control={form.control}
          name="impactModel"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="col-span-full">
              <FieldLabel htmlFor={field.name}>Impact model</FieldLabel>
              <TextArea id={field.name} {...field} value={field.value ?? ""} rows={5} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="impactMetrics"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="col-span-full">
              <FieldLabel htmlFor={field.name}>Impact metrics</FieldLabel>
              <TextArea id={field.name} {...field} value={field.value ?? ""} rows={4} />
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
              uploadKeyPrefix={`companies/${company.id}/hero`}
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
                placeholder='[{"title":"...","body":"..."}]'
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

        <Field className="col-span-full">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <FieldLabel>Retail / store locations</FieldLabel>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              prefix={<PlusIcon className="size-4" />}
              onClick={() => append({ ...emptyRetailLocation })}
            >
              Add store
            </Button>
          </div>
          <p className="mb-3 text-xs text-muted-foreground">
            Directory locations above are for site filters. Add street-level or store listings here (optional,
            multiple).
          </p>
          {fields.length === 0 ? (
            <p className="text-sm text-muted-foreground">No retail locations yet.</p>
          ) : (
            <Stack direction="column" className="gap-4">
              {fields.map((row, index) => (
                <div
                  key={row.id}
                  className="rounded-lg border border-border bg-card/40 p-4 @lg:col-span-2"
                >
                  <div className="mb-3 flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => remove(index)}
                    >
                      <Trash2Icon className="size-4" />
                      <span className="sr-only">Remove store</span>
                    </Button>
                  </div>
                  <div className="grid gap-3 @lg:grid-cols-2">
                    <Controller
                      control={form.control}
                      name={`retailLocations.${index}.label`}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid} className="@lg:col-span-2">
                          <FieldLabel htmlFor={field.name}>Store label</FieldLabel>
                          <Input id={field.name} {...field} value={field.value ?? ""} />
                          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        </Field>
                      )}
                    />
                    <Controller
                      control={form.control}
                      name={`retailLocations.${index}.addressLine1`}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid} className="@lg:col-span-2">
                          <FieldLabel htmlFor={field.name}>Address line 1</FieldLabel>
                          <Input id={field.name} {...field} value={field.value ?? ""} />
                          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        </Field>
                      )}
                    />
                    <Controller
                      control={form.control}
                      name={`retailLocations.${index}.addressLine2`}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid} className="@lg:col-span-2">
                          <FieldLabel htmlFor={field.name}>Address line 2</FieldLabel>
                          <Input id={field.name} {...field} value={field.value ?? ""} />
                          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        </Field>
                      )}
                    />
                    <Controller
                      control={form.control}
                      name={`retailLocations.${index}.city`}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor={field.name}>City</FieldLabel>
                          <Input id={field.name} {...field} value={field.value ?? ""} />
                          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        </Field>
                      )}
                    />
                    <Controller
                      control={form.control}
                      name={`retailLocations.${index}.region`}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor={field.name}>State / region</FieldLabel>
                          <Input id={field.name} {...field} value={field.value ?? ""} />
                          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        </Field>
                      )}
                    />
                    <Controller
                      control={form.control}
                      name={`retailLocations.${index}.postalCode`}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor={field.name}>Postal code</FieldLabel>
                          <Input id={field.name} {...field} value={field.value ?? ""} />
                          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        </Field>
                      )}
                    />
                    <Controller
                      control={form.control}
                      name={`retailLocations.${index}.countryCode`}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor={field.name}>Country code</FieldLabel>
                          <Input
                            id={field.name}
                            {...field}
                            value={field.value ?? ""}
                            maxLength={2}
                            className="uppercase"
                            placeholder="US"
                          />
                          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        </Field>
                      )}
                    />
                    <Controller
                      control={form.control}
                      name={`retailLocations.${index}.url`}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid} className="@lg:col-span-2">
                          <FieldLabel htmlFor={field.name}>Maps or store URL</FieldLabel>
                          <Input id={field.name} {...field} value={field.value ?? ""} />
                          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        </Field>
                      )}
                    />
                  </div>
                </div>
              ))}
            </Stack>
          )}
        </Field>

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
          name="funderIds"
          render={({ field }) => (
            <Field className="col-span-full">
              <FieldLabel>Funders</FieldLabel>
              <RelationSelector relations={taxonomy.funders} ids={field.value ?? []} setIds={field.onChange} />
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="certificationIds"
          render={({ field }) => (
            <Field className="col-span-full">
              <FieldLabel>Certifications</FieldLabel>
              <RelationSelector
                relations={taxonomy.certifications}
                ids={field.value ?? []}
                setIds={field.onChange}
              />
            </Field>
          )}
        />

        <div className="flex justify-between gap-4 col-span-full">
          <Button size="md" variant="secondary" asChild>
            <Link href="/admin/companies">Back to list</Link>
          </Button>
          <Button
            size="md"
            isPending={mutation.isPending}
            suffix={<Kbd variant="outline" keys={["meta", "enter"]} />}
          >
            Save company
          </Button>
        </div>
      </form>
    </Form>
  )
}
