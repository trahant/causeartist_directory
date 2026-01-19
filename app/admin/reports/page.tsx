import { Suspense } from "react"
import { DataTableSkeleton } from "~/components/data-table/data-table-skeleton"
import { findReports } from "~/server/admin/reports/queries"
import { reportTableParamsCache } from "~/server/admin/reports/schema"
import { ReportTable } from "./_components/report-table"

export default async function ({ searchParams }: PageProps<"/admin/reports">) {
  const search = reportTableParamsCache.parse(await searchParams)
  const reportsPromise = findReports(search)

  return (
    <Suspense fallback={<DataTableSkeleton title="Reports" />}>
      <ReportTable reportsPromise={reportsPromise} />
    </Suspense>
  )
}
