"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useHotkeys } from "@mantine/hooks"
import { slugify } from "@primoui/utils"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import type { ComponentProps } from "react"
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
import { companyCreateSchema } from "~/server/admin/companies/schema"

type Props = ComponentProps<"form">

export function CompanyCreateForm({ className, ...props }: Props) {
  const router = useRouter()
  const queryClient = useQueryClient()

  const form = useForm({
    resolver: zodResolver(companyCreateSchema),
    defaultValues: {
      name: "",
      slug: "",
    },
  })

  useComputedField({
    form,
    sourceField: "name",
    computedField: "slug",
    callback: slugify,
    enabled: true,
  })

  const mutation = useMutation(
    orpc.admin.companies.create.mutationOptions({
      onSuccess: data => {
        toast.success("Company created")
        void queryClient.invalidateQueries({ queryKey: orpc.admin.companies.key() })
        if (data?.id) router.push(`/admin/companies/${data.id}`)
      },
      onError: e => toast.error(e.message),
    }),
  )

  const onSubmit = form.handleSubmit(d => mutation.mutate(d))
  useHotkeys([["mod+enter", () => void onSubmit()]], [], true)

  return (
    <Form {...form}>
      <Stack className="justify-between">
        <H3 className="truncate">New company</H3>
        <Button type="button" variant="secondary" size="sm" asChild>
          <Link href="/admin/companies">Back to list</Link>
        </Button>
      </Stack>
      <form onSubmit={onSubmit} className={cx("mt-4 grid gap-4", className)} noValidate {...props}>
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
              <Input id={field.name} {...field} className="font-mono text-sm" />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Button size="md" isPending={mutation.isPending}>
          Create company
        </Button>
      </form>
    </Form>
  )
}
