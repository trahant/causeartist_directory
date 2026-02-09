import { redirect } from "next/navigation"
import { BookmarkTable } from "~/app/(web)/dashboard/bookmarks/table"
import { getServerSession } from "~/lib/auth"
import { findTools } from "~/server/shared/tools/queries"
import { toolListCache } from "~/server/shared/tools/schema"

export const BookmarkListing = async ({ searchParams }: PageProps<"/dashboard/bookmarks">) => {
  const params = toolListCache.parse(await searchParams)
  const session = await getServerSession()

  if (!session?.user) {
    throw redirect("/auth/login?next=/dashboard/bookmarks")
  }

  const toolsQuery = await findTools(params, {
    bookmarks: { some: { userId: session.user.id } },
  })

  return <BookmarkTable {...toolsQuery} />
}
