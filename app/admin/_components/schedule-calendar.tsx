"use client"

import { useQuery } from "@tanstack/react-query"
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parse,
  startOfWeek,
  subMonths,
} from "date-fns"
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { useQueryState } from "nuqs"
import type { ComponentProps } from "react"
import { ToolStatus } from "~/.generated/prisma/browser"
import { MetricHeader } from "~/components/admin/metrics/metric-header"
import { Button } from "~/components/common/button"
import { ButtonGroup } from "~/components/common/button-group"
import { Card } from "~/components/common/card"
import { Link } from "~/components/common/link"
import { ShowMore } from "~/components/common/show-more"
import { Stack } from "~/components/common/stack"
import { orpc } from "~/lib/orpc-query"
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

export const Calendar = ({ className, ...props }: ComponentProps<"div">) => {
  const defaultFormat = "yyyy-MM"
  const defaultValue = format(new Date(), defaultFormat)
  const [month, setMonth] = useQueryState("month", { defaultValue })

  const currentMonth = parse(month, defaultFormat, new Date())
  const calendarStart = startOfWeek(currentMonth, { weekStartsOn: 1 })
  const calendarEnd = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 })

  const { data: tools = [] } = useQuery(
    orpc.tools.scheduled.queryOptions({
      input: {
        start: calendarStart,
        end: calendarEnd,
      },
    }),
  )

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })
  const length = Math.ceil(days.length / 7)
  const weeks = Array.from({ length }, (_, i) => days.slice(i * 7, (i + 1) * 7))

  const today = new Date()
  const isCurrentMonth = isSameMonth(currentMonth, today)

  return (
    <Card hover={false} className={cx("gap-2", className)} {...props}>
      <MetricHeader
        title="Calendar"
        value={format(currentMonth, "MMM yyyy")}
        note={
          <ButtonGroup className="-my-1.5">
            {!isCurrentMonth && (
              <Button
                variant="secondary"
                size="md"
                prefix={<CalendarIcon />}
                onClick={() => setMonth(null)}
              >
                Now
              </Button>
            )}

            <Button
              variant="secondary"
              size="md"
              prefix={<ChevronLeftIcon />}
              onClick={() => setMonth(format(subMonths(currentMonth, 1), defaultFormat))}
            >
              <span className="max-sm:sr-only">Previous</span>
            </Button>

            <Button
              variant="secondary"
              size="md"
              suffix={<ChevronRightIcon />}
              onClick={() => setMonth(format(addMonths(currentMonth, 1), defaultFormat))}
            >
              <span className="max-sm:sr-only">Next</span>
            </Button>
          </ButtonGroup>
        }
      />

      <div className="w-[calc(100%+2.5rem)] -mx-5 px-5 overflow-x-auto mask-r-from-[calc(100%-1.5rem)] mask-l-from-[calc(100%-1.5rem)]">
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
                    month={currentMonth}
                    tools={tools.filter(tool => isSameDay(tool.publishedAt!, day))}
                  />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
