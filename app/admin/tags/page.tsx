import { Suspense } from "react"
import { TagTable } from "~/app/admin/tags/_components/tag-table"
import { DataTableSkeleton } from "~/components/data-table/data-table-skeleton"
import { findTags } from "~/server/admin/tags/queries"
import { tagTableParamsCache } from "~/server/admin/tags/schema"

export default async function ({ searchParams }: PageProps<"/admin/tags">) {
  const search = tagTableParamsCache.parse(await searchParams)
  const tagsPromise = findTags(search)

  return (
    <Suspense fallback={<DataTableSkeleton title="Tags" />}>
      <TagTable tagsPromise={tagsPromise} />
    </Suspense>
  )
}
