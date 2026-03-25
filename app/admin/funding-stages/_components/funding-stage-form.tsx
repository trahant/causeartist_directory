"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useHotkeys } from "@mantine/hooks"
import { createId } from "@paralleldrive/cuid2"
import { slugify } from "@primoui/utils"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { type ComponentProps, useMemo } from "react"
import { Controller, FormProvider as Form, useForm } from "react-hook-form"
import { toast } from "sonner"
import { Button } from "~/components/common/button"
import { Field, FieldError, FieldLabel } from "~/components/common/field"
import { H3 } from "~/components/common/heading"
import { Input } from "~/components/common/input"
import { Link } from "~/components/common/link"
import { Stack } from "~/components/common/stack"
import { useComputedField } from "~/hooks/use-computed-field"
import { orpc } from "~/lib/orpc-query"
import { cx } from "~/lib/utils"
import type { findFundingStageByIdForAdmin } from "~/server/admin/funding-stages/queries"
import { fundingStageUpsertSchema } from "~/server/admin/funding-stages/schema"

type Props = ComponentProps<"form"> & {
  fundingStage?: NonNullable<Awaited<ReturnType<typeof findFundingStageByIdForAdmin>>>
}

export function FundingStageForm({ className, title, fundingStage, ...props }: Props) {
  const router = useRouter()
  const qc = useQueryClient()
  const id = useMemo(() => fundingStage?.id ?? createId(), [fundingStage?.id])

  const form = useForm({
    resolver: zodResolver(fundingStageUpsertSchema),
    values: {
      id,
      name: fundingStage?.name ?? "",
      slug: fundingStage?.slug ?? "",
      sortOrder: fundingStage?.sortOrder ?? 100,
    },
  })

  const mutation = useMutation(
    orpc.admin.fundingStages.upsert.mutationOptions({
      onSuccess: data => {
        toast.success(`Funding stage ${fundingStage ? "updated" : "created"}`)
        void qc.invalidateQueries({ queryKey: orpc.admin.fundingStages.key() })
        if (data?.id) router.push(`/admin/funding-stages/${data.id}`)
      },
      onError: e => toast.error(e.message),
    }),
  )

  const onSubmit = form.handleSubmit(d => mutation.mutate(d))
  useHotkeys([["mod+enter", () => void onSubmit()]], [], true)

  useComputedField({
    form,
    sourceField: "name",
    computedField: "slug",
    callback: slugify,
    enabled: !fundingStage,
  })

  return (
    <Form {...form}>
      <Stack className="justify-between">
        <H3 className="truncate">{title}</H3>
        <Button type="button" variant="secondary" size="sm" asChild>
          <Link href="/admin/funding-stages">Back</Link>
        </Button>
      </Stack>
      <form onSubmit={onSubmit} className={cx("grid gap-4", className)} noValidate {...props}>
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
              <FieldLabel htmlFor={field.name}>Slug</FieldLabel>
              <Input {...field} id={field.name} className="font-mono text-sm" />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="sortOrder"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Sort order</FieldLabel>
              <Input
                id={field.name}
                type="number"
                min={0}
                name={field.name}
                ref={field.ref}
                onBlur={field.onBlur}
                value={field.value}
                onChange={e => field.onChange(e.target.value === "" ? 100 : Number(e.target.value))}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Button type="submit" variant="primary" disabled={mutation.isPending}>
          Save
        </Button>
      </form>
    </Form>
  )
}
