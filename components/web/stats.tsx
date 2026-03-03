"use client"

import { useLocale, useTranslations } from "next-intl"
import type { ComponentProps } from "react"
import { Stat } from "~/components/web/ui/stat"
import { cva, cx, type VariantProps } from "~/lib/utils"

const statsVariants = cva({
  base: "flex flex-wrap items-start justify-between gap-x-4 gap-y-8",

  variants: {
    alignment: {
      start: "items-start justify-between text-start",
      center: "items-center justify-around text-center",
      end: "items-end justify-between text-end",
    },
  },

  defaultVariants: {
    alignment: "center",
  },
})

type StatsProps = ComponentProps<"div"> & VariantProps<typeof statsVariants>

export const Stats = ({ alignment, className, ...props }: StatsProps) => {
  const t = useTranslations("components.stats")
  const locale = useLocale()

  const stats = [
    { value: 250000, label: t("pageviews") },
    { value: 2000, label: t("tools") },
    { value: 5000, label: t("subscribers") },
  ]

  return (
    <div className={cx(statsVariants({ alignment, className }))} {...props}>
      {stats.map(({ value, label }, index) => (
        <div
          key={`${index}-${label}`}
          className="space-y-1 basis-40 hover:[[href]]:opacity-80 lg:basis-48"
        >
          <Stat
            value={value}
            format={{ notation: "compact" }}
            locales={locale}
            className="text-5xl font-display font-semibold [--number-flow-char-height:0.75em]"
          />

          <p className="text-sm text-muted-foreground lg:text-base">{label}</p>
        </div>
      ))}
    </div>
  )
}
