import { zodResolver } from "@hookform/resolvers/zod"
import { useHotkeys } from "@mantine/hooks"
import { useMutation } from "@tanstack/react-query"
import { capitalCase } from "change-case"
import { useTranslations } from "next-intl"
import type { Dispatch, SetStateAction } from "react"
import { Controller, FormProvider as Form, useForm } from "react-hook-form"
import { toast } from "sonner"
import { ReportType } from "~/.generated/prisma/browser"
import { Button } from "~/components/common/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/common/dialog"
import { Field, FieldError, FieldLabel } from "~/components/common/field"
import { Input } from "~/components/common/input"
import { RadioGroup, RadioGroupItem } from "~/components/common/radio-group"
import { Stack } from "~/components/common/stack"
import { TextArea } from "~/components/common/textarea"
import { LoginDialog } from "~/components/web/auth/login-dialog"
import { reportsConfig } from "~/config/reports"
import { useSession } from "~/lib/auth-client"
import { orpc } from "~/lib/orpc-query"
import { createReportToolSchema } from "~/server/web/shared/schema"
import type { ToolOne } from "~/server/web/tools/payloads"

type ToolReportDialogProps = {
  tool: ToolOne
  isOpen: boolean
  setIsOpen: Dispatch<SetStateAction<boolean>>
}

export const ToolReportDialog = ({ tool, isOpen, setIsOpen }: ToolReportDialogProps) => {
  const { data: session } = useSession()
  const t = useTranslations("dialogs.report")
  const tSchema = useTranslations("schema")

  const schema = createReportToolSchema(tSchema)

  const form = useForm({
    resolver: zodResolver(schema),
    values: {
      type: "" as unknown as ReportType,
      message: "",
      toolId: tool.id,
      email: session?.user.email || "",
    },
  })

  const mutation = useMutation(
    orpc.web.reports.report.mutationOptions({
      onSuccess: () => {
        toast.success(t("success_message"))
        setIsOpen(false)
        form.reset()
      },
      onError: error => {
        toast.error(error.message)
      },
    }),
  )

  const onSubmit = form.handleSubmit(data => mutation.mutate(data))

  // A hotkey to submit the form
  useHotkeys([["mod+enter", () => onSubmit()]], [], true)

  if (!reportsConfig.enabled) {
    return null
  }

  if (reportsConfig.requireSignIn && !session?.user) {
    return <LoginDialog isOpen={isOpen} setIsOpen={setIsOpen} />
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("title", { toolName: tool.name })}</DialogTitle>
          <DialogDescription>{t("question")}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={onSubmit} className="grid gap-4" noValidate>
            {!session?.user && (
              <Controller
                control={form.control}
                name="email"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel data-required htmlFor={field.name}>
                      {t("email_label")}
                    </FieldLabel>
                    <Input
                      id={field.name}
                      type="email"
                      placeholder={t("email_placeholder")}
                      data-1p-ignore
                      {...field}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            )}

            <Controller
              control={form.control}
              name="type"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel data-required>{t("type_label")}</FieldLabel>
                  <RadioGroup
                    value={field.value}
                    onValueChange={field.onChange}
                    className="flex flex-col items-start gap-2.5"
                  >
                    {Object.values(ReportType).map(type => (
                      <Stack key={type} size="sm" wrap={false} asChild>
                        <FieldLabel className="font-normal text-secondary-foreground overflow-visible cursor-pointer">
                          <RadioGroupItem value={type} />
                          {capitalCase(type)}
                        </FieldLabel>
                      </Stack>
                    ))}
                  </RadioGroup>

                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} className="mt-1" />
                  )}
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="message"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel
                    data-required={form.watch("type") === ReportType.Other || undefined}
                    htmlFor={field.name}
                  >
                    {t("message_label")}
                  </FieldLabel>
                  <TextArea
                    id={field.name}
                    placeholder={t("message_placeholder")}
                    className="min-h-20"
                    {...field}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>
                {t("cancel_button")}
              </Button>

              <Button type="submit" className="min-w-28" isPending={mutation.isPending}>
                {t("send_button")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
