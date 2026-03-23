"use client"

import { GlobeIcon } from "lucide-react"
import { flagUrlFromCountryCode } from "~/lib/country-flag"
import { cx } from "~/lib/utils"

type Props = {
  countryCode: string | null | undefined
  className?: string
}

/** Flag image from flagcdn when countryCode is set; otherwise a globe icon. */
export function LocationCountryFlag({ countryCode, className }: Props) {
  const url = flagUrlFromCountryCode(countryCode)

  if (!url) {
    return (
      <GlobeIcon
        className={cx("h-3 w-3 shrink-0 text-muted-foreground", className)}
        aria-hidden
      />
    )
  }

  return (
    <span className={cx("inline-flex h-3 shrink-0 items-center", className)} aria-hidden>
      <img
        src={url}
        alt=""
        width={36}
        height={24}
        loading="lazy"
        decoding="async"
        draggable={false}
        className="h-3 w-auto max-h-3 max-w-4.5 rounded-[2px] object-contain object-left"
      />
    </span>
  )
}
