"use client"

import { addMonths, eachDayOfInterval, format, isSameDay, isSameMonth, subMonths } from "date-fns"
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import type { ComponentProps } from "react"
import { ToolStatus } from "~/.generated/prisma/browser"
import { Button } from "~/components/common/button"
import { H5 } from "~/components/common/heading"
import { Link } from "~/components/common/link"
import { ShowMore } from "~/components/common/show-more"
import { Stack } from "~/components/common/stack"
import { cx } from "~/lib/utils"
import type { findScheduledTools } from "~/server/admin/tools/queries"

type Tools = Awaited<ReturnType<typeof findScheduledTools>>

type CalendarDayProps = ComponentProps<"td"> & {
  day: Date
  month: Date
  tools: Tools
}

const CalendarDay = ({ className, day, tools, month, ...props }: CalendarDayProps) => {
  const isToday = isSameDay(day, new Date())
  const isCurrentMonth = isSameMonth(day, month)

  return (
    <td
      className={cx(
        "h-24 p-2 border align-top lg:px-3",
        !isCurrentMonth && "background-dashed text-muted-foreground/50",
        className,
      )}
      {...props}
    >
      <Stack size="xs" direction="column">
        <h6
          className={cx("text-xs text-muted-foreground", isToday && "font-semibold text-primary")}
        >
          {format(day, "d")}
        </h6>

        <ShowMore
          size="xs"
          direction="column"
          className="w-full"
          items={tools}
          limit={5}
          renderItem={({ id, name, status }) => (
            <Link
              key={id}
              href={`/admin/tools/${id}`}
              className={cx(
                "max-w-full font-medium truncate hover:text-primary",
                status === ToolStatus.Published && "text-muted-foreground/50 line-through",
              )}
            >
              {name}
            </Link>
          )}
        />
      </Stack>
    </td>
  )
}

type CalendarProps = ComponentProps<"div"> & {
  tools: Tools
  month: Date
  calendarStart: Date
  calendarEnd: Date
}

export const Calendar = ({
  className,
  tools,
  month,
  calendarStart,
  calendarEnd,
  ...props
}: CalendarProps) => {
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })
  const length = Math.ceil(days.length / 7)
  const weeks = Array.from({ length }, (_, i) => days.slice(i * 7, (i + 1) * 7))

  const today = new Date()
  const isCurrentMonth = isSameMonth(month, today)

  return (
    <div className={cx("space-y-2", className)} {...props}>
      <Stack size="sm">
        <H5 className="mr-auto">{format(month, "MMM yyyy")}</H5>

        {!isCurrentMonth && (
          <Button variant="secondary" size="md" prefix={<CalendarIcon />} asChild>
            <Link href={`/admin/schedule?month=${format(today, "yyyy-MM")}`}>Today</Link>
          </Button>
        )}

        <Button variant="secondary" size="md" prefix={<ChevronLeftIcon />} asChild>
          <Link href={`/admin/schedule?month=${format(subMonths(month, 1), "yyyy-MM")}`}>
            <span className="max-sm:sr-only">Previous</span>
          </Link>
        </Button>

        <Button variant="secondary" size="md" suffix={<ChevronRightIcon />} asChild>
          <Link href={`/admin/schedule?month=${format(addMonths(month, 1), "yyyy-MM")}`}>
            <span className="max-sm:sr-only">Next</span>
          </Link>
        </Button>
      </Stack>

      <div className="overflow-x-auto">
        <table className="min-w-3xl w-full table-fixed border-collapse text-sm">
          <thead>
            <tr>
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, index) => (
                <th
                  key={day}
                  style={{ width: index < 5 ? "16%" : "10%" }}
                  className="text-start text-muted-foreground p-2 text-xs font-normal"
                >
                  {day}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {weeks.map((week, weekIndex) => (
              <tr key={weekIndex}>
                {week.map(day => (
                  <CalendarDay
                    key={day.toISOString()}
                    day={day}
                    month={month}
                    tools={tools.filter(tool => isSameDay(tool.publishedAt!, day))}
                  />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
