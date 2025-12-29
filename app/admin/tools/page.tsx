import { Suspense } from "react"
import { ToolTable } from "~/app/admin/tools/_components/tool-table"
import { withAdminPage } from "~/components/admin/auth-hoc"
import { DataTableSkeleton } from "~/components/data-table/data-table-skeleton"
import { findTools } from "~/server/admin/tools/queries"
import { toolTableParamsCache } from "~/server/admin/tools/schema"

export default withAdminPage(async ({ searchParams }: PageProps<"/admin/tools">) => {
  const search = toolTableParamsCache.parse(await searchParams)
  const toolsPromise = findTools(search)

  return (
    <Suspense fallback={<DataTableSkeleton title="Tools" />}>
      <ToolTable toolsPromise={toolsPromise} />
    </Suspense>
  )
})
