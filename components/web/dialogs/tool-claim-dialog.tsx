import { zodResolver } from "@hookform/resolvers/zod"
import { useHookFormAction } from "@next-safe-action/adapter-react-hook-form/hooks"
import { getDomain } from "@primoui/utils"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/common/form"
import { Input } from "~/components/common/input"
import { Stack } from "~/components/common/stack"
import { LoginDialog } from "~/components/web/auth/login-dialog"
import { claimsConfig } from "~/config/claims"
import { siteConfig } from "~/config/site"
import { useSession } from "~/lib/auth-client"
import { sendToolClaimOtp, verifyToolClaimOtp } from "~/server/web/actions/claim"
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

  const sendOtpAction = useHookFormAction(sendToolClaimOtp, zodResolver(emailSchema), {
    formProps: {
      defaultValues: {
        toolId: tool.id,
        email: "",
      },
    },

    actionProps: {
      onSuccess: () => {
        toast.success(t("otp_sent"))
        setVerificationEmail(sendOtpAction.form.getValues().email)
        setStep("otp")
        setCooldownRemaining(claimsConfig.resendCooldown)
      },

      onError: ({ error }) => {
        toast.error(error.serverError)
      },
    },
  })

  const verifyOtpAction = useHookFormAction(verifyToolClaimOtp, zodResolver(otpSchema), {
    formProps: {
      defaultValues: {
        toolId: tool.id,
        otp: "",
      },
    },

    actionProps: {
      onSuccess: () => {
        toast.success(t("success_message", { toolName: tool.name }))
        router.push(`/${tool.slug}`)
      },

      onError: ({ error }) => {
        toast.error(error.serverError)
      },
    },
  })

  // Reset forms and state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setStep("email")
      sendOtpAction.form.reset()
      verifyOtpAction.form.reset()
      setVerificationEmail("")
      setCooldownRemaining(0)
    }
  }, [isOpen])

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
      sendOtpAction.form.setError("email", {
        type: "manual",
        message: t("email_domain_error", { domain: toolDomain }),
      })

      return
    }

    sendOtpAction.handleSubmitWithAction()
  }

  const handleResendOtp = () => {
    if (cooldownRemaining > 0 || sendOtpAction.action.isPending) return

    sendOtpAction.form.setValue("email", verificationEmail)
    sendOtpAction.handleSubmitWithAction()
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
          <Form {...sendOtpAction.form}>
            <form
              onSubmit={sendOtpAction.form.handleSubmit(handleEmailSubmit)}
              className="space-y-6"
              noValidate
            >
              <DialogDescription>
                <p>{t("intro", { domain: toolDomain })}</p>

                <p>{t("benefits_title")}</p>

                <ul className="mt-2 list-disc pl-4">
                  <li>{t("benefit_update")}</li>
                  <li>{t("benefit_manage")}</li>
                  <li>{t("benefit_promote", { siteName: siteConfig.name })}</li>
                </ul>
              </DialogDescription>

              <FormField
                control={sendOtpAction.form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("email_label")}</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        data-1p-ignore
                        placeholder={t("email_placeholder", { domain: toolDomain })}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>
                  {t("cancel_button")}
                </Button>

                <Button
                  type="submit"
                  className="min-w-28"
                  isPending={sendOtpAction.action.isPending}
                >
                  {t("send_code_button")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        ) : (
          <Form {...verifyOtpAction.form}>
            <form
              onSubmit={verifyOtpAction.handleSubmitWithAction}
              className="space-y-6"
              noValidate
            >
              <DialogDescription>
                <p>{t("verification_intro", { email: verificationEmail })}</p>
              </DialogDescription>

              <Stack direction="column">
                <FormField
                  control={verifyOtpAction.form.control}
                  name="otp"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>{t("verification_label")}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t("verification_placeholder", {
                            length: claimsConfig.otpLength,
                          })}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Stack size="sm" className="w-full justify-between">
                  <Button
                    size="sm"
                    variant="secondary"
                    type="button"
                    onClick={() => {
                      setStep("email")
                      verifyOtpAction.form.reset()
                    }}
                  >
                    {t("change_email_button")}
                  </Button>

                  <Button
                    size="sm"
                    variant="secondary"
                    type="button"
                    onClick={handleResendOtp}
                    isPending={sendOtpAction.action.isPending}
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

                <Button
                  type="submit"
                  className="min-w-28"
                  isPending={verifyOtpAction.action.isPending}
                >
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
