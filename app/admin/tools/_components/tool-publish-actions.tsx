"use client"

import { formatDate } from "date-fns"
import { BadgeCheckIcon, CalendarIcon } from "lucide-react"
import { type ComponentProps, type ReactNode, useState } from "react"
import { useFormContext } from "react-hook-form"
import { ToolStatus } from "~/.generated/prisma/browser"
import { Button, type ButtonProps } from "~/components/common/button"
import { Calendar } from "~/components/common/calendar"
import { Checkbox } from "~/components/common/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/common/dialog"
import { FormControl, FormField, FormItem, FormLabel } from "~/components/common/form"
import { H5, H6 } from "~/components/common/heading"
import { Input } from "~/components/common/input"
import { Kbd } from "~/components/common/kbd"
import { Note } from "~/components/common/note"
import { Popover, PopoverContent, PopoverTrigger } from "~/components/common/popover"
import { RadioGroup, RadioGroupItem } from "~/components/common/radio-group"
import { Stack } from "~/components/common/stack"
import { cx } from "~/lib/utils"
import type { findToolById } from "~/server/admin/tools/queries"
import type { ToolSchema } from "~/server/admin/tools/schema"

type ToolPublishActionsProps = ComponentProps<typeof Stack> & {
  tool?: NonNullable<Awaited<ReturnType<typeof findToolById>>>
  isPending: boolean
  isStatusPending: boolean
  onStatusSubmit: (status: ToolStatus, publishedAt: Date | null) => void
}

type PopoverOption = {
  status: ToolStatus
  title: ReactNode
  description?: ReactNode
  button?: ButtonProps
}

type ActionConfig = Omit<ButtonProps, "popover"> & {
  popover?: {
    title: ReactNode
    description?: ReactNode
    options: PopoverOption[]
  }
}

export const ToolPublishActions = ({
  tool,
  isPending,
  isStatusPending,
  onStatusSubmit,
  children,
  ...props
}: ToolPublishActionsProps) => {
  const { control, watch } = useFormContext<ToolSchema>()
  const [status, submitterEmail, publishedAt] = watch(["status", "submitterEmail", "publishedAt"])
  const publishedAtDate = new Date(publishedAt ?? new Date())

  const [isOpen, setIsOpen] = useState(false)
  const [currentStatus, setCurrentStatus] = useState(status)
  const [isScheduleOpen, setIsScheduleOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState(formatDate(publishedAtDate, "yyyy-MM-dd"))
  const [selectedTime, setSelectedTime] = useState(formatDate(publishedAtDate, "HH:mm"))

  const handlePublished = () => {
    onStatusSubmit(ToolStatus.Published, new Date())
    setIsOpen(false)
  }

  const handleScheduled = () => {
    const scheduledDate = new Date(`${selectedDate}T${selectedTime}`)
    onStatusSubmit(ToolStatus.Scheduled, scheduledDate)
    setIsOpen(false)
  }

  const handleDraft = () => {
    onStatusSubmit(ToolStatus.Draft, null)
    setIsOpen(false)
  }

  const toolActions: Record<ToolStatus, ActionConfig[]> = {
    [ToolStatus.Pending]: [
      {
        type: "button",
        children: "Review",
        variant: "fancy",
        popover: {
          title: "Review the pending submission",
          options: [
            {
              status: ToolStatus.Published,
              title: "Publish now",
              description: "Approve and publish this tool immediately",
              button: {
                onClick: handlePublished,
                children: "Publish",
              },
            },
            {
              status: ToolStatus.Scheduled,
              title: "Schedule for later",
              description: "Set automatic future publish date",
              button: {
                onClick: handleScheduled,
                children: "Schedule",
              },
            },
            {
              status: ToolStatus.Draft,
              title: "Convert to draft",
              description: "Make this tool a draft for further editing",
              button: {
                onClick: handleDraft,
                children: "Convert",
              },
            },
          ],
        },
      },
      {
        type: "submit",
        children: "Update",
        variant: "primary",
      },
    ],

    [ToolStatus.Draft]: [
      {
        type: "button",
        children: "Publish",
        variant: "fancy",
        popover: {
          title: "Ready to publish this tool?",
          options: [
            {
              status: ToolStatus.Published,
              title: "Publish now",
              description: "Set this tool live immediately",
              button: {
                onClick: handlePublished,
                children: "Publish",
              },
            },
            {
              status: ToolStatus.Scheduled,
              title: "Schedule for later",
              description: "Set automatic future publish date",
              button: {
                onClick: handleScheduled,
                children: "Schedule",
              },
            },
          ],
        },
      },
      {
        type: "submit",
        children: "Save Draft",
        variant: "primary",
      },
    ],

    [ToolStatus.Scheduled]: [
      {
        type: "button",
        children: "Scheduled",
        variant: "secondary",
        prefix: <CalendarIcon />,
        popover: {
          title: "Update tool status",
          options: [
            {
              status: ToolStatus.Draft,
              title: "Revert to draft",
              description: "Do not publish",
              button: {
                onClick: handleDraft,
                children: "Unschedule",
              },
            },
            {
              status: ToolStatus.Scheduled,
              title: "Schedule for later",
              description: "Set automatic future publish date",
              button: {
                onClick: handleScheduled,
                children: "Reschedule",
              },
            },
            {
              status: ToolStatus.Published,
              title: "Publish now",
              description: "Set this tool live immediately",
              button: {
                onClick: handlePublished,
                children: "Publish",
              },
            },
          ],
        },
      },
      {
        type: "submit",
        children: "Update",
        variant: "primary",
      },
    ],

    [ToolStatus.Published]: [
      {
        type: "button",
        children: "Published",
        variant: "secondary",
        prefix: <BadgeCheckIcon />,
        popover: {
          title: "Update tool status",
          options: [
            {
              status: ToolStatus.Draft,
              title: "Unpublished",
              description: "Revert this tool to a draft",
              button: {
                onClick: handleDraft,
                children: "Unpublish",
              },
            },
            {
              status: ToolStatus.Published,
              title: "Published",
              description: "Keep this tool publicly available",
            },
          ],
        },
      },
      {
        type: "submit",
        children: "Update",
        variant: "primary",
      },
    ],
  }

  return (
    <Stack size="sm" {...props}>
      {children}

      {toolActions[tool?.status ?? ToolStatus.Draft].map(({ popover, ...action }) => {
        if (popover) {
          const opts = popover.options
          const currentOption = opts.find(o => o.status === currentStatus) || opts[0]

          return (
            <Popover key={String(action.children)} open={isOpen} onOpenChange={setIsOpen}>
              <PopoverTrigger asChild>
                <Button size="md" isPending={isStatusPending} {...action} />
              </PopoverTrigger>

              <PopoverContent
                align="center"
                side="top"
                sideOffset={8}
                className="w-72"
                onOpenAutoFocus={e => e.preventDefault()}
                asChild
              >
                <Stack size="lg" direction="column" className="items-stretch gap-5 min-w-80">
                  <Stack size="sm" direction="column">
                    <H5>{popover.title}</H5>

                    {popover.description && <Note>{popover.description}</Note>}
                  </Stack>

                  <RadioGroup
                    defaultValue={currentOption.status}
                    className="contents"
                    onValueChange={value => setCurrentStatus(value as ToolStatus)}
                  >
                    {opts.map(option => (
                      <Stack size="sm" className="items-start" key={option.status}>
                        <RadioGroupItem id={option.status} value={option.status} />

                        <Stack size="sm" direction="column" className="flex-1" asChild>
                          <label htmlFor={option.status}>
                            <H6>{option.title}</H6>

                            {option.description && <Note>{option.description}</Note>}

                            {option.status === ToolStatus.Scheduled &&
                              currentStatus === ToolStatus.Scheduled && (
                                <Stack size="sm" wrap={false} className="mt-2 items-stretch w-full">
                                  <Button
                                    size="md"
                                    variant="secondary"
                                    onClick={() => setIsScheduleOpen(true)}
                                    suffix={<CalendarIcon />}
                                    className="w-full tabular-nums"
                                  >
                                    {selectedDate}
                                  </Button>

                                  <Input
                                    type="time"
                                    value={selectedTime}
                                    onChange={e => setSelectedTime(e.target.value)}
                                    className="w-full tabular-nums"
                                  />

                                  <Dialog open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
                                    <DialogContent className="max-w-sm">
                                      <DialogHeader>
                                        <DialogTitle>Pick a date to publish</DialogTitle>
                                      </DialogHeader>

                                      <Calendar
                                        mode="single"
                                        selected={new Date(selectedDate)}
                                        defaultMonth={new Date(selectedDate)}
                                        disabled={{ before: new Date() }}
                                        onSelect={date => {
                                          if (date) {
                                            setSelectedDate(formatDate(date, "yyyy-MM-dd"))
                                          }
                                          setIsScheduleOpen(false)
                                        }}
                                      />
                                    </DialogContent>
                                  </Dialog>
                                </Stack>
                              )}
                          </label>
                        </Stack>
                      </Stack>
                    ))}
                  </RadioGroup>

                  {submitterEmail &&
                    status !== ToolStatus.Published &&
                    (currentOption.status === ToolStatus.Published ||
                      currentOption.status === ToolStatus.Scheduled) && (
                      <FormField
                        control={control}
                        name="notifySubmitter"
                        render={({ field }) => (
                          <FormItem size="sm" direction="row">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={() => field.onChange(!field.value)}
                              />
                            </FormControl>

                            <FormLabel
                              className={cx(!field.value && "font-normal text-muted-foreground")}
                            >
                              Notify submitter via email
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    )}

                  <Stack className="justify-between">
                    <Button size="md" variant="secondary" onClick={() => setIsOpen(false)}>
                      Cancel
                    </Button>

                    {currentOption.button && (
                      <Button size="md" isPending={isStatusPending} {...currentOption.button} />
                    )}
                  </Stack>
                </Stack>
              </PopoverContent>
            </Popover>
          )
        }

        return (
          <Button
            key={String(action.children)}
            name="submit"
            size="md"
            isPending={isPending}
            className="lg:min-w-24"
            suffix={<Kbd variant="outline" keys={["meta", "enter"]} />}
            {...action}
          />
        )
      })}
    </Stack>
  )
}
