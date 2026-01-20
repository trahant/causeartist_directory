import { notFound } from "next/navigation"
import { TagForm } from "~/app/admin/tags/_components/tag-form"
import { Wrapper } from "~/components/common/wrapper"
import { findTagById } from "~/server/admin/tags/queries"
import { findToolList } from "~/server/admin/tools/queries"

export default async function ({ params }: PageProps<"/admin/tags/[id]">) {
  const { id } = await params
  const tag = await findTagById(id)

  if (!tag) {
    return notFound()
  }

  return (
    <Wrapper size="md" gap="sm">
      <TagForm title="Update tag" tag={tag} toolsPromise={findToolList()} />
    </Wrapper>
  )
}
