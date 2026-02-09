import { redirect } from "next/navigation"
import { DashboardTable } from "~/app/(web)/dashboard/table"
import { getServerSession } from "~/lib/auth"
import { findTools } from "~/server/shared/tools/queries"
import { toolListCache } from "~/server/shared/tools/schema"

export const DashboardToolListing = async ({ searchParams }: PageProps<"/dashboard">) => {
  const params = toolListCache.parse(await searchParams)
  const session = await getServerSession()

  if (!session?.user) {
    throw redirect("/auth/login?next=/dashboard")
  }

  const toolsQuery = await findTools(params, {
    OR: [{ submitterEmail: session.user.email }, { ownerId: session.user.id }],
  })

  return <DashboardTable {...toolsQuery} />
}
