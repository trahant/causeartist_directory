"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useHotkeys } from "@mantine/hooks"
import { useHookFormAction } from "@next-safe-action/adapter-react-hook-form/hooks"
import { getRandomString, slugify } from "@primoui/utils"
import { addMonths, formatDate } from "date-fns"
import { CalendarIcon, ClockIcon } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { type ComponentProps, useMemo, useState } from "react"
import { toast } from "sonner"
import { AdType } from "~/.generated/prisma/browser"
import { AdActions } from "~/app/admin/ads/_components/ad-actions"
import { Button } from "~/components/common/button"
import { Kbd } from "~/components/common/kbd"
import { Calendar } from "~/components/common/calendar"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/common/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/common/form"
import { FormMedia } from "~/components/common/form-media"
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
import { cx } from "~/lib/utils"
import { upsertAd } from "~/server/admin/ads/actions"
import type { findAdById } from "~/server/admin/ads/queries"
import { adSchema } from "~/server/admin/ads/schema"

type AdFormProps = ComponentProps<"form"> & {
  ad?: NonNullable<Awaited<ReturnType<typeof findAdById>>>
}

export function AdForm({ className, title, ad, ...props }: AdFormProps) {
  const router = useRouter()
  const resolver = zodResolver(adSchema)
  const [isStartsAtOpen, setIsStartsAtOpen] = useState(false)
  const [isEndsAtOpen, setIsEndsAtOpen] = useState(false)

  const { form, action, handleSubmitWithAction } = useHookFormAction(upsertAd, resolver, {
    formProps: {
      defaultValues: {
        id: ad?.id ?? "",
        name: ad?.name ?? "",
        email: ad?.email ?? "",
        description: ad?.description ?? "",
        websiteUrl: ad?.websiteUrl ?? "",
        faviconUrl: ad?.faviconUrl ?? "",
        bannerUrl: ad?.bannerUrl ?? "",
        buttonLabel: ad?.buttonLabel ?? "",
        type: ad?.type ?? AdType.All,
        startsAt: ad?.startsAt ?? new Date(),
        endsAt: ad?.endsAt ?? addMonths(new Date(), 1),
      },
    },

    actionProps: {
      onSuccess: ({ data }) => {
        toast.success(`Ad successfully ${ad ? "updated" : "created"}`)
        router.push(`/admin/ads/${data?.id}`)
      },

      onError: ({ error }) => {
        toast.error(error.serverError)
      },
    },
  })

  useHotkeys([["mod+enter", () => handleSubmitWithAction()]], [], true)

  const [name, websiteUrl, startsAt, endsAt] = form.watch([
    "name",
    "websiteUrl",
    "startsAt",
    "endsAt",
  ])

  const path = useMemo(() => `ads/${name ? slugify(name) : getRandomString(12)}`, [name])

  const formatDateDisplay = (date: Date) => formatDate(date, "yyyy-MM-dd")
  const formatTimeDisplay = (date: Date) => formatDate(date, "HH:mm")

  const [startsAtDate, setStartsAtDate] = useState(formatDateDisplay(startsAt))
  const [startsAtTime, setStartsAtTime] = useState(formatTimeDisplay(startsAt))
  const [endsAtDate, setEndsAtDate] = useState(formatDateDisplay(endsAt))
  const [endsAtTime, setEndsAtTime] = useState(formatTimeDisplay(endsAt))

  const updateStartsAt = (date: string, time: string) => {
    const newDate = new Date(`${date}T${time}`)
    if (!Number.isNaN(newDate.getTime())) {
      form.setValue("startsAt", newDate)
    }
  }

  const updateEndsAt = (date: string, time: string) => {
    const newDate = new Date(`${date}T${time}`)
    if (!Number.isNaN(newDate.getTime())) {
      form.setValue("endsAt", newDate)
    }
  }

  const setStartsAtNow = () => {
    const now = new Date()
    setStartsAtDate(formatDateDisplay(now))
    setStartsAtTime(formatTimeDisplay(now))
    form.setValue("startsAt", now)
  }

  const setEndsAtNow = () => {
    const now = new Date()
    setEndsAtDate(formatDateDisplay(now))
    setEndsAtTime(formatTimeDisplay(now))
    form.setValue("endsAt", now)
  }

  return (
    <Form {...form}>
      <Stack className="justify-between">
        <H3 className="flex-1 truncate">{title}</H3>

        <Stack size="sm" className="-my-0.5">
          {ad && <AdActions ad={ad} size="md" />}
        </Stack>
      </Stack>

      <form
        onSubmit={handleSubmitWithAction}
        className={cx("grid gap-4 @lg:grid-cols-2", className)}
        noValidate
        {...props}
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel isRequired>Name</FormLabel>
              <FormControl>
                <Input data-1p-ignore {...field} />
              </FormControl>
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
          name="websiteUrl"
          render={({ field }) => (
            <FormItem className="col-span-full">
              <FormLabel isRequired>Website URL</FormLabel>
              <FormControl>
                <Input type="url" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem className="col-span-full">
              <FormLabel>Description</FormLabel>
              <FormControl>
                <TextArea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="faviconUrl"
          render={({ field }) => (
            <FormMedia
              form={form}
              field={field}
              path={`${path}/favicon`}
              fetchType="favicon"
              websiteUrl={websiteUrl}
            >
              {field.value && (
                <Image
                  src={field.value}
                  alt="Favicon"
                  width={32}
                  height={32}
                  className="size-8 border box-content rounded-md object-contain"
                  unoptimized
                />
              )}
            </FormMedia>
          )}
        />

        <FormField
          control={form.control}
          name="bannerUrl"
          render={({ field }) => (
            <FormMedia form={form} field={field} path={`${path}/banner`}>
              {field.value && (
                <Image
                  src={field.value}
                  alt="Banner"
                  height={72}
                  width={128}
                  unoptimized
                  className="h-8 w-auto border box-content rounded-md aspect-video object-cover"
                />
              )}
            </FormMedia>
          )}
        />

        <FormField
          control={form.control}
          name="buttonLabel"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Button Label</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select ad type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.values(AdType).map(type => (
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
          name="startsAt"
          render={() => (
            <FormItem className="items-stretch">
              <Stack className="justify-between">
                <FormLabel isRequired>Starts At</FormLabel>

                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  prefix={<ClockIcon />}
                  onClick={setStartsAtNow}
                  className="-my-1"
                >
                  Set as now
                </Button>
              </Stack>

              <Stack size="sm" wrap={false} className="items-stretch w-full">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsStartsAtOpen(true)}
                  suffix={<CalendarIcon />}
                  className="w-full tabular-nums justify-between"
                >
                  {startsAtDate}
                </Button>

                <Input
                  type="time"
                  value={startsAtTime}
                  onChange={e => {
                    setStartsAtTime(e.target.value)
                    updateStartsAt(startsAtDate, e.target.value)
                  }}
                  className="w-full tabular-nums"
                />

                <Dialog open={isStartsAtOpen} onOpenChange={setIsStartsAtOpen}>
                  <DialogContent className="max-w-sm">
                    <DialogHeader>
                      <DialogTitle>Pick start date</DialogTitle>
                    </DialogHeader>

                    <Calendar
                      mode="single"
                      selected={startsAt}
                      defaultMonth={startsAt}
                      onSelect={date => {
                        if (date) {
                          const newDate = formatDateDisplay(date)
                          setStartsAtDate(newDate)
                          updateStartsAt(newDate, startsAtTime)
                        }
                        setIsStartsAtOpen(false)
                      }}
                    />
                  </DialogContent>
                </Dialog>
              </Stack>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="endsAt"
          render={() => (
            <FormItem className="items-stretch">
              <Stack className="justify-between">
                <FormLabel isRequired>Ends At</FormLabel>

                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  prefix={<ClockIcon />}
                  onClick={setEndsAtNow}
                  className="-my-1"
                >
                  Set as now
                </Button>
              </Stack>

              <Stack size="sm" wrap={false} className="items-stretch w-full">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsEndsAtOpen(true)}
                  suffix={<CalendarIcon />}
                  className="w-full tabular-nums justify-between"
                >
                  {endsAtDate}
                </Button>

                <Input
                  type="time"
                  value={endsAtTime}
                  onChange={e => {
                    setEndsAtTime(e.target.value)
                    updateEndsAt(endsAtDate, e.target.value)
                  }}
                  className="w-full tabular-nums"
                />

                <Dialog open={isEndsAtOpen} onOpenChange={setIsEndsAtOpen}>
                  <DialogContent className="max-w-sm">
                    <DialogHeader>
                      <DialogTitle>Pick end date</DialogTitle>
                    </DialogHeader>

                    <Calendar
                      mode="single"
                      selected={endsAt}
                      defaultMonth={endsAt}
                      disabled={{ before: startsAt }}
                      onSelect={date => {
                        if (date) {
                          const newDate = formatDateDisplay(date)
                          setEndsAtDate(newDate)
                          updateEndsAt(newDate, endsAtTime)
                        }
                        setIsEndsAtOpen(false)
                      }}
                    />
                  </DialogContent>
                </Dialog>
              </Stack>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-between gap-4 col-span-full">
          <Button size="md" variant="secondary" asChild>
            <Link href="/admin/ads">Cancel</Link>
          </Button>

          <Button
            size="md"
            isPending={action.isPending}
            suffix={<Kbd variant="outline" keys={["meta", "enter"]} />}
          >
            {ad ? "Update ad" : "Create ad"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
