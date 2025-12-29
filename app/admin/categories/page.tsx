import { Suspense } from "react"
import { CategoryTable } from "~/app/admin/categories/_components/category-table"
import { withAdminPage } from "~/components/admin/auth-hoc"
import { DataTableSkeleton } from "~/components/data-table/data-table-skeleton"
import { findCategories } from "~/server/admin/categories/queries"
import { categoryTableParamsCache } from "~/server/admin/categories/schema"

export default withAdminPage(async ({ searchParams }: PageProps<"/admin/categories">) => {
  const search = categoryTableParamsCache.parse(await searchParams)
  const categoriesPromise = findCategories(search)

  return (
    <Suspense fallback={<DataTableSkeleton title="Categories" />}>
      <CategoryTable categoriesPromise={categoriesPromise} />
    </Suspense>
  )
})
