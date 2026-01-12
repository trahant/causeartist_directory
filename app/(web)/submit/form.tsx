"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useHookFormAction } from "@next-safe-action/adapter-react-hook-form/hooks"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import type { ComponentProps } from "react"
import { toast } from "sonner"
import { Button } from "~/components/common/button"
import { Checkbox } from "~/components/common/checkbox"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/common/form"
import { Hint } from "~/components/common/hint"
import { Input } from "~/components/common/input"
import { TextArea } from "~/components/common/textarea"
import { FeatureNudge } from "~/components/web/feature-nudge"
import { useTrackEvent } from "~/hooks/use-track-event"
import { isToolPublished } from "~/lib/tools"
import { cx } from "~/lib/utils"
import { submitTool } from "~/server/web/actions/submit"
import { createSubmitToolSchema } from "~/server/web/shared/schema"

export const SubmitForm = ({ className, ...props }: ComponentProps<"form">) => {
  const router = useRouter()
  const trackEvent = useTrackEvent()
  const t = useTranslations("forms.submit")
  const tSchema = useTranslations("schema")

  const schema = createSubmitToolSchema(tSchema)
  const resolver = zodResolver(schema)

  const { form, action, handleSubmitWithAction } = useHookFormAction(submitTool, resolver, {
    formProps: {
      values: {
        name: "",
        websiteUrl: "",
        submitterNote: "",
        newsletterOptIn: true,
      },
    },

    actionProps: {
      onSuccess: ({ data }) => {
        form.reset()

        if (!data) return

        // Track event
        trackEvent("submit_tool", { slug: data.slug })

        if (isToolPublished(data)) {
          if (data.isFeatured) {
            toast.info(t("already_published", { name: data.name }))
          } else {
            toast.custom(toastT => <FeatureNudge tool={data} t={toastT} />, {
              duration: Number.POSITIVE_INFINITY,
            })
          }
          router.push(`/${data.slug}`)
        } else {
          toast.success(t("submitted_success", { name: data.name }))
          router.push(`/submit/${data.slug}`)
        }
      },
    },
  })

  return (
    <Form {...form}>
      <form
        onSubmit={handleSubmitWithAction}
        className={cx("grid w-full gap-5 @md:grid-cols-2", className)}
        noValidate
        {...props}
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel isRequired>{t("name_label")}:</FormLabel>
              <FormControl>
                <Input size="lg" placeholder={t("name_placeholder")} data-1p-ignore {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="websiteUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel isRequired>{t("website_label")}:</FormLabel>
              <FormControl>
                <Input type="url" size="lg" placeholder={t("website_placeholder")} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="submitterNote"
          render={({ field }) => (
            <FormItem className="col-span-full">
              <FormLabel>{t("note_label")}:</FormLabel>
              <FormControl>
                <TextArea size="lg" placeholder={t("note_placeholder")} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="newsletterOptIn"
          render={({ field }) => (
            <FormItem className="flex-row items-center col-span-full gap-2">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <FormLabel className="font-normal">{t("newsletter_label")}</FormLabel>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="col-span-full">
          <Button variant="primary" isPending={action.isPending} className="flex min-w-32">
            {t("submit_button")}
          </Button>
        </div>

        {action.result.serverError && (
          <Hint className="col-span-full">{action.result.serverError}</Hint>
        )}
      </form>
    </Form>
  )
}
