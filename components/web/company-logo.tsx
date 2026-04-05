"use client"

import { useState } from "react"

interface CompanyLogoProps {
  logoUrl: string | null | undefined
  name: string
  className?: string
}

export function CompanyLogo({ logoUrl, name, className }: CompanyLogoProps) {
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
        className={`flex shrink-0 items-center justify-center bg-neutral-100 text-xs font-bold text-neutral-500 ${className ?? ""}`}
      >
        {initials || "?"}
      </div>
    )
  }

  return (
    <img
      src={logoUrl}
      alt={name}
      className={[className, "shrink-0"].filter(Boolean).join(" ")}
      onError={() => setError(true)}
    />
  )
}
