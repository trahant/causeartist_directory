"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useDebouncedCallback, useHotkeys, useLocalStorage } from "@mantine/hooks"
import { useHookFormAction } from "@next-safe-action/adapter-react-hook-form/hooks"
import { getRandomDigits } from "@primoui/utils"
import { millisecondsInSecond } from "date-fns/constants"
import { useTranslations } from "next-intl"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Controller, FormProvider as Form } from "react-hook-form"
import { toast } from "sonner"
import { Button } from "~/components/common/button"
import { Field } from "~/components/common/field"
import { Input } from "~/components/common/input"
import { Stack } from "~/components/common/stack"
import { TextArea } from "~/components/common/textarea"
import { feedbackConfig } from "~/config/feedback"
import { siteConfig } from "~/config/site"
import { useSession } from "~/lib/auth-client"
import { cx } from "~/lib/utils"
import { reportFeedback } from "~/server/web/actions/report"
import { createFeedbackSchema } from "~/server/web/shared/schema"

type FeedbackWidgetFormProps = {
  toastId: string
  setDismissed: (dismissed: boolean) => void
}

const FeedbackWidgetForm = ({ toastId, setDismissed }: FeedbackWidgetFormProps) => {
  const { data: session } = useSession()
  const t = useTranslations("forms.feedback")
  const tSchema = useTranslations("schema")

  const schema = createFeedbackSchema(tSchema)
  const resolver = zodResolver(schema)

  const { form, action, handleSubmitWithAction } = useHookFormAction(reportFeedback, resolver, {
    formProps: {
      defaultValues: {
        email: session?.user.email || "",
        message: "",
      },
    },

    actionProps: {
      onSuccess: () => {
        toast.success(t("success_message"), {
          id: toastId,
          duration: 3000,
        })

        setDismissed(true)
        form.reset()
      },

      onError: ({ error }) => {
        toast.error(error.serverError, {
          id: toastId,
          duration: 3000,
        })
      },
    },
  })

  // A hotkey to submit the form
  useHotkeys([["mod+enter", () => handleSubmitWithAction()]], [], true)

  return (
    <Form {...form}>
      <Stack direction="column" className="items-stretch w-full" asChild>
        <form onSubmit={handleSubmitWithAction} noValidate>
          <p className="mb-1 text-xs">{t("question", { siteName: siteConfig.name })}</p>

          {!session?.user && (
            <Controller
              control={form.control}
              name="email"
              render={({ field, fieldState }) => (
                <Field>
                  <Input
                    type="email"
                    size="sm"
                    placeholder={t("email_placeholder")}
                    className={cx("text-xs", fieldState.error ? "bg-destructive/5!" : "")}
                    data-1p-ignore
                    {...field}
                  />
                </Field>
              )}
            />
          )}

          <Controller
            control={form.control}
            name="message"
            render={({ field, fieldState }) => (
              <Field>
                <TextArea
                  size="sm"
                  placeholder={t("feedback_placeholder")}
                  className={cx("h-20 text-xs", fieldState.error ? "bg-destructive/5!" : "")}
                  {...field}
                />
              </Field>
            )}
          />

          <Stack size="sm">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="text-xs flex-1"
              onClick={() => {
                toast.dismiss()
                setDismissed(true)
              }}
            >
              {t("dismiss_button")}
            </Button>

            <Button size="sm" className="text-xs flex-1" isPending={action.isPending}>
              {t("send_button")}
            </Button>
          </Stack>
        </form>
      </Stack>
    </Form>
  )
}

export const FeedbackWidget = () => {
  const toastId = useMemo(() => getRandomDigits(10), [])
  const startTime = useRef(Date.now())
  const [shouldShow, setShouldShow] = useState(false)
  const maxScrollRef = useRef(0)
  const feedbackKey = `${siteConfig.slug}-feedback-dismissed`
  const pageViewsKey = `${siteConfig.slug}-page-views`
  const { minTimeSpent, minPageView, minScroll, timeCheckInterval } = feedbackConfig.thresholds

  const [dismissed, setDismissed] = useLocalStorage({
    key: feedbackKey,
    defaultValue: false,
    getInitialValueInEffect: false,
  })

  // Initialize page views once
  const pageViews = useMemo(() => {
    if (typeof sessionStorage === "undefined") {
      return 1
    }

    const storedViews = Number.parseInt(sessionStorage.getItem(pageViewsKey) || "1", 10)
    sessionStorage.setItem(pageViewsKey, (storedViews + 1).toString())
    return storedViews + 1
  }, [pageViewsKey])

  // Debounced scroll handler
  const handleScroll = useDebouncedCallback(() => {
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight
    const scrolled = (window.scrollY / scrollHeight) * 100
    maxScrollRef.current = Math.max(maxScrollRef.current, scrolled)
  }, 150)

  // Check engagement criteria
  const checkEngagement = useCallback(() => {
    if (dismissed || shouldShow) return

    const timeSpent = (Date.now() - startTime.current) / 1000

    if (
      timeSpent >= minTimeSpent &&
      pageViews >= minPageView &&
      maxScrollRef.current >= minScroll
    ) {
      setShouldShow(true)

      toast(<FeedbackWidgetForm toastId={toastId} setDismissed={setDismissed} />, {
        id: toastId,
        duration: Number.POSITIVE_INFINITY,
        className: "max-w-54 py-3",
        onDismiss: () => setDismissed(true),
      })
    }
  }, [
    dismissed,
    shouldShow,
    pageViews,
    toastId,
    minTimeSpent,
    minPageView,
    minScroll,
    setDismissed,
  ])

  // Setup scroll listener and engagement checker
  useEffect(() => {
    if (dismissed || !feedbackConfig.enabled) return

    window.addEventListener("scroll", handleScroll)
    const interval = setInterval(checkEngagement, timeCheckInterval * millisecondsInSecond)

    return () => {
      window.removeEventListener("scroll", handleScroll)
      clearInterval(interval)
    }
  }, [dismissed, handleScroll, checkEngagement, timeCheckInterval])

  return null
}
