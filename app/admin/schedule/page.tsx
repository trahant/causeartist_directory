import { endOfMonth, endOfWeek, format, parse, startOfWeek } from "date-fns"
import { createLoader, parseAsString } from "nuqs/server"
import { Calendar } from "~/app/admin/schedule/calendar"
import { H3 } from "~/components/common/heading"
import { Wrapper } from "~/components/common/wrapper"
import { findScheduledTools } from "~/server/admin/tools/queries"

export default async function ({ searchParams }: PageProps<"/admin/schedule">) {
  const defaultMonth = format(new Date(), "yyyy-MM")
  const searchParamsLoader = createLoader({ month: parseAsString.withDefault(defaultMonth) })
  const { month } = searchParamsLoader(await searchParams)

  const currentMonth = parse(month, "yyyy-MM", new Date())
  const calendarStart = startOfWeek(currentMonth, { weekStartsOn: 1 })
  const calendarEnd = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 })

  const tools = await findScheduledTools({
    where: { publishedAt: { gte: calendarStart, lte: calendarEnd } },
  })

  return (
    <Wrapper size="lg" gap="xs">
      <H3>Schedule calendar</H3>

      <Calendar
        tools={tools}
        month={currentMonth}
        calendarStart={calendarStart}
        calendarEnd={calendarEnd}
        className="w-full"
      />
    </Wrapper>
  )
}
