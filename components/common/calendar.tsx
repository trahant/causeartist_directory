"use client"

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { useFormatter } from "next-intl"
import type { ComponentProps } from "react"
import type { Formatters } from "react-day-picker"
import { type Chevron, DayPicker } from "react-day-picker"
import { buttonVariants } from "~/components/common/button"

const CalendarChevron = ({ orientation }: ComponentProps<typeof Chevron>) => {
  if (orientation === "left") {
    return <ChevronLeftIcon />
  }

  return <ChevronRightIcon />
}

const Calendar = ({ classNames, ...props }: ComponentProps<typeof DayPicker>) => {
  const format = useFormatter()

  const buttonClasses = buttonVariants({
    variant: "ghost",
    className: "text-lg p-1 pointer-events-auto",
  })

  // Use next-intl formatter for i18n date formatting.
  // Override timeZone to the browser's local timezone because react-day-picker
  // creates dates in local time, while next-intl may default to UTC.
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone

  const formatters: Partial<Formatters> = {
    formatCaption: date => format.dateTime(date, { month: "long", year: "numeric", timeZone }),
    formatWeekdayName: date => format.dateTime(date, { weekday: "short", timeZone }),
    formatMonthDropdown: date => format.dateTime(date, { month: "long", timeZone }),
  }

  return (
    <DayPicker
      weekStartsOn={1}
      formatters={formatters}
      classNames={{
        months: "relative flex flex-col sm:flex-row gap-y-4 sm:gap-x-4 sm:gap-y-0",
        month: "group/month space-y-4 w-full",
        month_caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium",
        nav: "absolute top-px inset-x-0 z-10 flex items-center justify-between gap-x-1 pointer-events-none",
        button_previous: buttonClasses,
        button_next: buttonClasses,
        month_grid: "w-full border-collapse gap-y-1",
        weekdays: "flex",
        weekday: "text-muted-foreground/50 rounded-md min-w-8 w-full font-normal text-xs",
        week: "group/week flex mt-2",
        day: "group/day relative w-full text-center text-[0.8125rem] rounded-md focus-within:z-20",
        day_button:
          "relative w-full px-1 py-[10%] cursor-pointer rounded-md hover:bg-muted hover:group-data-selected/day:bg-transparent",
        selected: "bg-foreground! text-background!",
        range_middle: "bg-muted! text-foreground! rounded-none",
        today: "font-semibold text-primary opacity-100",
        outside: "opacity-40",
        disabled: "opacity-40 pointer-events-none",
        hidden: "invisible",
        ...classNames,
      }}
      components={{ Chevron: CalendarChevron }}
      {...props}
    />
  )
}

export { Calendar }
