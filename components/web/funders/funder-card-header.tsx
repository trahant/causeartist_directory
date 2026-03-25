"use client"

import { Badge } from "~/components/common/badge"
import { useLayoutEffect, useRef, useState } from "react"

const GAP_ICON = 12 // gap-3 between icon and text block

const typeBadgeClassName =
  "shrink-0 rounded-full border-0 bg-blue-50 px-2 py-0.5 text-[10px] font-medium leading-tight text-blue-600"

type FunderCardHeaderProps = {
  logoUrl: string | null | undefined
  name: string
  typeLabel: string
}

export function FunderCardHeader({ logoUrl, name, typeLabel }: FunderCardHeaderProps) {
  const rowRef = useRef<HTMLDivElement>(null)
  const iconRef = useRef<HTMLImageElement>(null)
  const probeRef = useRef<HTMLDivElement>(null)
  const probeBadgeRef = useRef<HTMLSpanElement>(null)
  const [stacked, setStacked] = useState(false)

  useLayoutEffect(() => {
    if (!typeLabel) {
      setStacked(false)
      return
    }

    const measure = () => {
      const row = rowRef.current
      const icon = iconRef.current
      const probe = probeRef.current
      const badge = probeBadgeRef.current
      if (!row || !icon || !probe || !badge) return

      const rowRect = row.getBoundingClientRect()
      const iconRect = icon.getBoundingClientRect()
      const available = rowRect.width - iconRect.width - GAP_ICON
      if (available <= 0) {
        setStacked(true)
        return
      }

      const left = iconRect.left - rowRect.left + iconRect.width + GAP_ICON
      probe.style.left = `${left}px`
      probe.style.width = `${available}px`

      const probeRect = probe.getBoundingClientRect()
      const badgeRect = badge.getBoundingClientRect()
      setStacked(badgeRect.right > probeRect.right + 0.5)
    }

    measure()

    const row = rowRef.current
    if (!row || typeof ResizeObserver === "undefined") return

    const ro = new ResizeObserver(() => measure())
    ro.observe(row)
    return () => ro.disconnect()
  }, [name, typeLabel])

  if (!typeLabel) {
    return (
      <div className="flex w-full min-w-0 gap-3">
        <img
          src={logoUrl ?? undefined}
          alt={name}
          className="size-8 shrink-0 rounded object-contain"
        />
        <span className="text-pretty min-w-0 flex-1 text-sm font-semibold wrap-break-word">{name}</span>
      </div>
    )
  }

  return (
    <div ref={rowRef} className="relative w-full min-w-0">
      <div
        ref={probeRef}
        className="pointer-events-none absolute top-0 -z-10 opacity-0"
        aria-hidden
      >
        <div className="flex min-w-0 items-start justify-between gap-2">
          <span className="text-pretty min-w-0 flex-1 text-sm font-semibold wrap-break-word">{name}</span>
          <span ref={probeBadgeRef} className="shrink-0">
            <Badge className={typeBadgeClassName}>{typeLabel}</Badge>
          </span>
        </div>
      </div>

      {stacked ? (
        <div className="flex w-full min-w-0 flex-col gap-2">
          <img
            ref={iconRef}
            src={logoUrl ?? undefined}
            alt={name}
            className="size-8 shrink-0 rounded object-contain"
          />
          <div className="flex min-w-0 w-full flex-col gap-1.5">
            <span className="text-pretty w-full text-sm font-semibold wrap-break-word">{name}</span>
            <div className="flex w-full justify-end">
              <Badge className={typeBadgeClassName}>{typeLabel}</Badge>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex w-full min-w-0 gap-3">
          <img
            ref={iconRef}
            src={logoUrl ?? undefined}
            alt={name}
            className="size-8 shrink-0 rounded object-contain"
          />
          <div className="flex min-w-0 flex-1 items-start justify-between gap-2">
            <span className="text-pretty min-w-0 flex-1 text-sm font-semibold wrap-break-word">{name}</span>
            <Badge className={typeBadgeClassName}>{typeLabel}</Badge>
          </div>
        </div>
      )}
    </div>
  )
}
