import { Suspense } from "react"
import { withAdminPage } from "~/components/admin/auth-hoc"
import { DataTableSkeleton } from "~/components/data-table/data-table-skeleton"
import { findUsers } from "~/server/admin/users/queries"
import { userTableParamsCache } from "~/server/admin/users/schema"
import { UserTable } from "./_components/user-table"

export default withAdminPage(async ({ searchParams }: PageProps<"/admin/users">) => {
  const search = userTableParamsCache.parse(await searchParams)
  const usersPromise = findUsers(search)

  return (
    <Suspense fallback={<DataTableSkeleton title="Users" />}>
      <UserTable usersPromise={usersPromise} />
    </Suspense>
  )
})
