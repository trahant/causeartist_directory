"use client"

import type { PropsWithChildren } from "react"
import { Input } from "~/components/common/input"
import { FiltersProvider } from "~/contexts/filter-context"
import { Pagination, type PaginationProps } from "~/components/web/pagination"
import { directoryFilterParams } from "~/server/web/directory/schema"
import { useTranslations } from "next-intl"
import { DirectoryFilterBar } from "~/components/web/directory/directory-filter-bar"

type DirectoryListingProps = PropsWithChildren & {
  pagination: PaginationProps
  sectors: { name: string; slug: string }[]
}

export function DirectoryListing({ children, pagination, sectors }: DirectoryListingProps) {
  return (
    <FiltersProvider schema={directoryFilterParams} enableSort={false} enableFilters={false}>
      <div className="space-y-5" id="directory">
        <DirectoryFilterBar sectors={sectors} />
        {children}
      </div>

      <Pagination {...pagination} />
    </FiltersProvider>
  )
}

export function DirectoryListingSkeleton() {
  const t = useTranslations("common")

  return (
    <div className="space-y-5">
      <Input size="lg" placeholder={t("loading")} disabled />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-36 rounded-lg border bg-card animate-pulse"
          />
        ))}
      </div>
    </div>
  )
}
