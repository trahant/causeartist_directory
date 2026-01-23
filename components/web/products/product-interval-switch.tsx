"use client"

import { motion } from "motion/react"
import { useId, type ComponentProps, type ReactNode } from "react"
import { Ping } from "~/components/common/ping"
import type { ProductInterval } from "~/lib/products"
import { cx } from "~/lib/utils"

type Interval = {
  label: ReactNode
  value: string
  note?: ReactNode
}

type ProductIntervalSwitchProps = Omit<ComponentProps<"div">, "onChange"> & {
  intervals: Interval[]
  value: ProductInterval
  onChange: (value: ProductInterval) => void
}

export const ProductIntervalSwitch = ({
  className,
  intervals,
  value,
  onChange,
  ...props
}: ProductIntervalSwitchProps) => {
  const id = useId()

  return (
    <div className={cx("relative flex rounded-md bg-foreground/10 p-0.5", className)} {...props}>
      {intervals.map(interval => (
        <label
          key={interval.value}
          className={cx(
            "relative z-10 flex items-center whitespace-nowrap px-2.5 py-1 text-xs font-medium cursor-pointer transition",
            interval.value !== value && "opacity-60",
          )}
        >
          <input
            name="interval"
            type="radio"
            value={interval.value}
            checked={interval.value === value}
            onChange={() => onChange(interval.value as ProductInterval)}
            className="peer sr-only"
          />

          {interval.label}

          {interval.note && <div className="ml-2 text-xs text-green-500">{interval.note}</div>}

          {interval.value === "year" && value !== "year" && (
            <Ping className="absolute right-0 top-0 size-2.5 text-green-700/90 dark:text-green-300/90" />
          )}

          {interval.value === value && (
            <motion.div
              className="absolute inset-0 bg-background rounded-sm -z-10"
              layoutId={`${id}-indicator`}
              transition={{ type: "tween", duration: 0.125, ease: "easeOut" }}
            />
          )}
        </label>
      ))}
    </div>
  )
}
