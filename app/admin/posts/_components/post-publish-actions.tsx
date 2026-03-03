"use client"

import { formatDate } from "date-fns"
import { BadgeCheckIcon, CalendarIcon } from "lucide-react"
import { type ComponentProps, type ReactNode, useState } from "react"
import { PostStatus } from "~/.generated/prisma/browser"
import { Button, type ButtonProps } from "~/components/common/button"
import { Calendar } from "~/components/common/calendar"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/common/dialog"
import { H5, H6 } from "~/components/common/heading"
import { Input } from "~/components/common/input"
import { Kbd } from "~/components/common/kbd"
import { Note } from "~/components/common/note"
import { Popover, PopoverContent, PopoverTrigger } from "~/components/common/popover"
import { RadioGroup, RadioGroupItem } from "~/components/common/radio-group"
import { Stack } from "~/components/common/stack"

type PostPublishActionsProps = ComponentProps<typeof Stack> & {
  postStatus: PostStatus
  publishedAt?: Date | null
  isPending: boolean
  isStatusPending: boolean
  onStatusSubmit: (status: PostStatus, publishedAt: Date | null) => void
}

type PopoverOption = {
  status: PostStatus
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

export const PostPublishActions = ({
  postStatus,
  publishedAt,
  isPending,
  isStatusPending,
  onStatusSubmit,
  children,
  ...props
}: PostPublishActionsProps) => {
  const defaultScheduleDate =
    publishedAt && !Number.isNaN(new Date(publishedAt).getTime())
      ? new Date(publishedAt)
      : new Date()
  const [isOpen, setIsOpen] = useState(false)
  const [currentStatus, setCurrentStatus] = useState<PostStatus>(postStatus)
  const [isScheduleOpen, setIsScheduleOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState(formatDate(defaultScheduleDate, "yyyy-MM-dd"))
  const [selectedTime, setSelectedTime] = useState(formatDate(defaultScheduleDate, "HH:mm"))

  const handlePublished = () => {
    onStatusSubmit(PostStatus.Published, new Date())
    setIsOpen(false)
  }

  const handleScheduled = () => {
    const scheduledDate = new Date(`${selectedDate}T${selectedTime}`)
    onStatusSubmit(PostStatus.Scheduled, scheduledDate)
    setIsOpen(false)
  }

  const handleDraft = () => {
    onStatusSubmit(PostStatus.Draft, null)
    setIsOpen(false)
  }

  const postActions: Record<PostStatus, ActionConfig[]> = {
    [PostStatus.Draft]: [
      {
        type: "button",
        children: "Publish",
        variant: "fancy",
        popover: {
          title: "Ready to publish this post?",
          options: [
            {
              status: PostStatus.Published,
              title: "Publish now",
              description: "Make this post live immediately",
              button: {
                onClick: handlePublished,
                children: "Publish",
              },
            },
            {
              status: PostStatus.Scheduled,
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

    [PostStatus.Scheduled]: [
      {
        type: "button",
        children: "Scheduled",
        variant: "secondary",
        prefix: <CalendarIcon />,
        popover: {
          title: "Update post status",
          options: [
            {
              status: PostStatus.Draft,
              title: "Revert to draft",
              description: "Do not publish",
              button: {
                onClick: handleDraft,
                children: "Unschedule",
              },
            },
            {
              status: PostStatus.Scheduled,
              title: "Schedule for later",
              description: "Set automatic future publish date",
              button: {
                onClick: handleScheduled,
                children: "Reschedule",
              },
            },
            {
              status: PostStatus.Published,
              title: "Publish now",
              description: "Make this post live immediately",
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

    [PostStatus.Published]: [
      {
        type: "button",
        children: "Published",
        variant: "secondary",
        prefix: <BadgeCheckIcon />,
        popover: {
          title: "Update post status",
          options: [
            {
              status: PostStatus.Draft,
              title: "Unpublish",
              description: "Revert this post to a draft",
              button: {
                onClick: handleDraft,
                children: "Unpublish",
              },
            },
            {
              status: PostStatus.Published,
              title: "Published",
              description: "Keep this post publicly available",
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

      {postActions[postStatus].map(({ popover, ...action }) => {
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
                    defaultValue={currentOption?.status}
                    className="contents"
                    onValueChange={value => setCurrentStatus(value as PostStatus)}
                  >
                    {opts.map(option => (
                      <Stack size="sm" className="items-start" key={option.status}>
                        <RadioGroupItem id={`post-${option.status}`} value={option.status} />

                        <Stack size="sm" direction="column" className="flex-1" asChild>
                          <label htmlFor={`post-${option.status}`}>
                            <H6>{option.title}</H6>

                            {option.description && <Note>{option.description}</Note>}

                            {option.status === PostStatus.Scheduled &&
                              currentStatus === PostStatus.Scheduled && (
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

                  <Stack className="justify-between">
                    <Button size="md" variant="secondary" onClick={() => setIsOpen(false)}>
                      Cancel
                    </Button>

                    {currentOption?.button && (
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
