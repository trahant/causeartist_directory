"use client"

import { forwardRef, useState } from "react"

interface FunderLogoProps {
  logoUrl: string | null | undefined
  name: string
  className?: string
}

export const FunderLogo = forwardRef<HTMLDivElement, FunderLogoProps>(
  function FunderLogo({ logoUrl, name, className }, ref) {
    const [error, setError] = useState(false)

    const initials = name
      .split(" ")
      .slice(0, 2)
      .map(w => w[0])
      .join("")
      .toUpperCase()

    if (!logoUrl || error) {
      return (
        <div
          ref={ref}
          aria-hidden="true"
          className={`flex shrink-0 items-center justify-center bg-neutral-100 text-xs font-bold text-neutral-500 ${className ?? ""}`}
        >
          {initials || "?"}
        </div>
      )
    }

    return (
      <div ref={ref} className={`shrink-0 overflow-hidden ${className ?? ""}`}>
        <img
          src={logoUrl}
          alt=""
          aria-hidden="true"
          className="size-full object-contain"
          onError={() => setError(true)}
        />
      </div>
    )
  },
)
