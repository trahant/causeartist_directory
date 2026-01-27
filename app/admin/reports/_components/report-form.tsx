"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useHotkeys } from "@mantine/hooks"
import { useHookFormAction } from "@next-safe-action/adapter-react-hook-form/hooks"
import type { ComponentProps } from "react"
import { toast } from "sonner"
import { ReportActions } from "~/app/admin/reports/_components/report-actions"
import { Button } from "~/components/common/button"
import { Kbd } from "~/components/common/kbd"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/common/form"
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
import { reportsConfig } from "~/config/reports"
import { cx } from "~/lib/utils"
import { updateReport } from "~/server/admin/reports/actions"
import type { findReportById } from "~/server/admin/reports/queries"
import { reportSchema } from "~/server/admin/reports/schema"

type ReportFormProps = ComponentProps<"form"> & {
  report: NonNullable<Awaited<ReturnType<typeof findReportById>>>
}

export function ReportForm({ className, title, report, ...props }: ReportFormProps) {
  const resolver = zodResolver(reportSchema)

  const { form, action, handleSubmitWithAction } = useHookFormAction(updateReport, resolver, {
    formProps: {
      defaultValues: {
        id: report?.id ?? "",
        email: report?.email ?? "",
        type: report?.type,
        message: report?.message ?? "",
      },
    },

    actionProps: {
      onSuccess: () => {
        toast.success("Report successfully updated")
      },

      onError: ({ error }) => {
        toast.error(error.serverError)
      },
    },
  })

  useHotkeys([["mod+enter", () => handleSubmitWithAction()]], [], true)

  return (
    <Form {...form}>
      <Stack className="justify-between">
        <H3 className="flex-1 truncate">{title}</H3>

        <Stack size="sm" className="-my-0.5">
          <ReportActions report={report} size="md" />
        </Stack>
      </Stack>

      <form
        onSubmit={handleSubmitWithAction}
        className={cx("grid gap-4 @md:grid-cols-2", className)}
        noValidate
        {...props}
      >
        <FormField
          control={form.control}
          name="type"
          render={({ field: { value, onChange, ...field } }) => (
            <FormItem>
              <FormLabel isRequired>Type</FormLabel>
              <Select value={value} onValueChange={onChange} {...field}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a report type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {reportsConfig.reportTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel isRequired>Email</FormLabel>
              <FormControl>
                <Input type="email" data-1p-ignore {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem className="col-span-full">
              <FormLabel>Message</FormLabel>
              <FormControl>
                <TextArea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-between gap-4 col-span-full">
          <Button size="md" variant="secondary" asChild>
            <Link href="/admin/reports">Cancel</Link>
          </Button>

          <Button
            size="md"
            isPending={action.isPending}
            suffix={<Kbd variant="outline" keys={["meta", "enter"]} />}
          >
            Update report
          </Button>
        </div>
      </form>
    </Form>
  )
}
