import { zodResolver } from "@hookform/resolvers/zod"
import { getDomain } from "@primoui/utils"
import { useMutation } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Controller, FormProvider as Form, useForm } from "react-hook-form"
import { toast } from "sonner"
import type { z } from "zod"
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
import { Stack } from "~/components/common/stack"
import { LoginDialog } from "~/components/web/auth/login-dialog"
import { claimsConfig } from "~/config/claims"
import { siteConfig } from "~/config/site"
import { useSession } from "~/lib/auth-client"
import { orpc } from "~/lib/orpc-query"
import { createClaimToolEmailSchema, createClaimToolOtpSchema } from "~/server/web/shared/schema"
import type { ToolOne } from "~/server/web/tools/payloads"

type ToolClaimDialogProps = {
  tool: ToolOne
  isOpen: boolean
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>
}

export const ToolClaimDialog = ({ tool, isOpen, setIsOpen }: ToolClaimDialogProps) => {
  const { data: session } = useSession()
  const router = useRouter()
  const t = useTranslations("dialogs.claim")
  const tSchema = useTranslations("schema")
  const [step, setStep] = useState<"email" | "otp">("email")
  const [verificationEmail, setVerificationEmail] = useState("")
  const [cooldownRemaining, setCooldownRemaining] = useState(0)

  const emailSchema = createClaimToolEmailSchema(tSchema)
  const otpSchema = createClaimToolOtpSchema(tSchema)

  const toolDomain = getDomain(tool.websiteUrl)

  const emailForm = useForm({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      toolId: tool.id,
      email: "",
    },
  })

  const otpForm = useForm({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      toolId: tool.id,
      otp: "",
    },
  })

  const sendOtpMutation = useMutation(
    orpc.web.tools.sendClaimOtp.mutationOptions({
      onSuccess: () => {
        toast.success(t("otp_sent"))
        setVerificationEmail(emailForm.getValues().email)
        setStep("otp")
        setCooldownRemaining(claimsConfig.resendCooldown)
      },

      onError: error => {
        toast.error(error.message)
      },
    }),
  )

  const verifyOtpMutation = useMutation(
    orpc.web.tools.verifyClaimOtp.mutationOptions({
      onSuccess: () => {
        toast.success(t("success_message", { toolName: tool.name }))
        router.push(`/${tool.slug}`)
      },

      onError: error => {
        toast.error(error.message)
      },
    }),
  )

  // Reset forms and state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setStep("email")
      emailForm.reset()
      otpForm.reset()
      setVerificationEmail("")
      setCooldownRemaining(0)
    }
  }, [isOpen, emailForm, otpForm])

  // Cooldown timer effect
  useEffect(() => {
    if (cooldownRemaining <= 0) return

    const interval = setInterval(() => {
      setCooldownRemaining(prev => (prev > 0 ? prev - 1 : 0))
    }, 1000)

    return () => clearInterval(interval)
  }, [cooldownRemaining])

  const handleEmailSubmit = ({ email }: z.infer<typeof emailSchema>) => {
    if (toolDomain !== email.split("@")[1]) {
      emailForm.setError("email", {
        type: "manual",
        message: t("email_domain_error", { domain: toolDomain }),
      })

      return
    }

    sendOtpMutation.mutate(emailForm.getValues())
  }

  const handleResendOtp = () => {
    if (cooldownRemaining > 0 || sendOtpMutation.isPending) return

    emailForm.setValue("email", verificationEmail)
    sendOtpMutation.mutate(emailForm.getValues())
  }

  const getResendButtonText = () => {
    if (cooldownRemaining > 0) {
      return t("resend_in", { seconds: cooldownRemaining })
    }

    return t("resend_code")
  }

  if (!session?.user) {
    return <LoginDialog isOpen={isOpen} setIsOpen={setIsOpen} />
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("title", { toolName: tool.name })}</DialogTitle>
        </DialogHeader>

        {step === "email" ? (
          <Form {...emailForm}>
            <form
              onSubmit={emailForm.handleSubmit(handleEmailSubmit)}
              className="space-y-6"
              noValidate
            >
              <DialogDescription>
                <p>{t("intro", { domain: toolDomain })}</p>

                <p>{t("benefits_title")}</p>

                <ul className="mt-2 list-disc pl-4">
                  <li>{t("benefit_update")}</li>
                  <li>{t("benefit_manage")}</li>
                  <li>{t("benefit_upgrade", { siteName: siteConfig.name })}</li>
                </ul>
              </DialogDescription>

              <Controller
                control={emailForm.control}
                name="email"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>{t("email_label")}</FieldLabel>
                    <Input
                      id={field.name}
                      type="email"
                      data-1p-ignore
                      placeholder={t("email_placeholder", { domain: toolDomain })}
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

                <Button type="submit" className="min-w-28" isPending={sendOtpMutation.isPending}>
                  {t("send_code_button")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        ) : (
          <Form {...otpForm}>
            <form
              onSubmit={otpForm.handleSubmit(data => verifyOtpMutation.mutate(data))}
              className="space-y-6"
              noValidate
            >
              <DialogDescription>
                <p>{t("verification_intro", { email: verificationEmail })}</p>
              </DialogDescription>

              <Stack direction="column">
                <Controller
                  control={otpForm.control}
                  name="otp"
                  render={({ field, fieldState }) => (
                    <Field className="w-full" data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={field.name}>{t("verification_label")}</FieldLabel>
                      <Input
                        id={field.name}
                        placeholder={t("verification_placeholder", {
                          length: claimsConfig.otpLength,
                        })}
                        {...field}
                      />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />

                <Stack size="sm" className="w-full justify-between">
                  <Button
                    size="sm"
                    variant="secondary"
                    type="button"
                    onClick={() => {
                      setStep("email")
                      otpForm.reset()
                    }}
                  >
                    {t("change_email_button")}
                  </Button>

                  <Button
                    size="sm"
                    variant="secondary"
                    type="button"
                    onClick={handleResendOtp}
                    isPending={sendOtpMutation.isPending}
                    disabled={cooldownRemaining > 0}
                  >
                    {getResendButtonText()}
                  </Button>
                </Stack>
              </Stack>

              <DialogFooter>
                <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>
                  {t("cancel_button")}
                </Button>

                <Button type="submit" className="min-w-28" isPending={verifyOtpMutation.isPending}>
                  {t("claim_button", { toolName: tool.name })}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  )
}
