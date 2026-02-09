"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useHotkeys } from "@mantine/hooks"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { ComponentProps } from "react"
import { Controller, FormProvider as Form, useForm } from "react-hook-form"
import { toast } from "sonner"
import { ReportActions } from "~/app/admin/reports/_components/report-actions"
import { Button } from "~/components/common/button"
import { Field, FieldError, FieldLabel } from "~/components/common/field"
import { H3 } from "~/components/common/heading"
import { Input } from "~/components/common/input"
import { Kbd } from "~/components/common/kbd"
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
import { reportsConfig } from "~/config/reports"
import { orpc } from "~/lib/orpc-query"
import { cx } from "~/lib/utils"
import type { findReportById } from "~/server/admin/reports/queries"
import { reportSchema } from "~/server/admin/reports/schema"

type ReportFormProps = ComponentProps<"form"> & {
  report: NonNullable<Awaited<ReturnType<typeof findReportById>>>
}

export function ReportForm({ className, title, report, ...props }: ReportFormProps) {
  const queryClient = useQueryClient()

  const form = useForm({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      id: report?.id ?? "",
      email: report?.email ?? "",
      type: report?.type,
      message: report?.message ?? "",
    },
  })

  const mutation = useMutation(
    orpc.reports.update.mutationOptions({
      onSuccess: () => {
        toast.success("Report successfully updated")
        queryClient.invalidateQueries({ queryKey: orpc.reports.key() })
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

        <Stack size="sm" className="-my-0.5">
          <ReportActions report={report} size="md" />
        </Stack>
      </Stack>

      <form
        onSubmit={onSubmit}
        className={cx("grid gap-4 @md:grid-cols-2", className)}
        noValidate
        {...props}
      >
        <Controller
          control={form.control}
          name="type"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel data-required htmlFor={field.name}>
                Type
              </FieldLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id={field.name}>
                  <SelectValue placeholder="Select a report type" />
                </SelectTrigger>
                <SelectContent>
                  {reportsConfig.reportTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {type}
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
          name="email"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel data-required htmlFor={field.name}>
                Email
              </FieldLabel>
              <Input type="email" data-1p-ignore id={field.name} {...field} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="message"
          render={({ field, fieldState }) => (
            <Field className="col-span-full" data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Message</FieldLabel>
              <TextArea id={field.name} {...field} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <div className="flex justify-between gap-4 col-span-full">
          <Button size="md" variant="secondary" asChild>
            <Link href="/admin/reports">Cancel</Link>
          </Button>

          <Button
            size="md"
            isPending={mutation.isPending}
            suffix={<Kbd variant="outline" keys={["meta", "enter"]} />}
          >
            Update report
          </Button>
        </div>
      </form>
    </Form>
  )
}
