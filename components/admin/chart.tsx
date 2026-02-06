"use client"

import { format } from "date-fns"
import plur from "plur"
import type { ComponentProps } from "react"
import { Note } from "~/components/common/note"
import { Stack } from "~/components/common/stack"
import { Tooltip } from "~/components/common/tooltip"
import { cx } from "~/lib/utils"

export type ChartData = {
  date: string
  value: number
}

type ChartProps = Partial<ComponentProps<"div">> & {
  data: ChartData[]
  average?: number
  cellClassName?: string
  dataPrefix?: string
  dataLabel?: string
}

export const Chart = ({
  className,
  cellClassName,
  data,
  average,
  dataPrefix,
  dataLabel,
  ...props
}: ChartProps) => {
  if (data.length === 0) {
    return <Note>No data available.</Note>
  }

  const maxValue = Math.max(...data.map(d => d.value), average || 0)

  return (
    <div className={cx("relative flex size-full min-h-24", className)} {...props}>
      {average !== undefined && (
        <div
          className="absolute inset-x-0 z-10 flex items-center pointer-events-none"
          style={{ bottom: `${(average / maxValue) * 100}%` }}
        >
          <div className="h-px w-full flex-1 border border-dashed border-foreground/15" />

          <Note className="absolute right-0 bottom-1 text-xs text-shadow-2xs text-shadow-background">
            {dataPrefix}
            {Math.round(average).toLocaleString()}
          </Note>
        </div>
      )}

      <div className="flex items-end justify-between gap-[0.75%] flex-1">
        {data.map((item, index) => (
          <Tooltip
            key={item.date}
            side="bottom"
            tooltip={
              <Stack size="sm" direction="column">
                <span className="opacity-60">
                  {format(new Date(item.date), "EEE, MMM d, yyyy")}
                </span>

                <span className="font-medium">
                  {dataPrefix}
                  {item.value.toLocaleString()} {dataLabel && plur(dataLabel, item.value)}
                </span>
              </Stack>
            }
          >
            <div className="flex-1 flex items-end h-full">
              <div
                className={cx(
                  "flex-1 bg-primary rounded-full duration-300 opacity-75 hover:opacity-100",
                  index === data.length - 1 && "opacity-50",
                  cellClassName,
                )}
                style={{ height: `${(item.value / maxValue) * 100}%` }}
              />
            </div>
          </Tooltip>
        ))}
      </div>
    </div>
  )
}
