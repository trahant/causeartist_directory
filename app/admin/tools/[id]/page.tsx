import { notFound } from "next/navigation"
import { ToolForm } from "~/app/admin/tools/_components/tool-form"
import { Wrapper } from "~/components/common/wrapper"
import { findCategoryList } from "~/server/admin/categories/queries"
import { findTagList } from "~/server/admin/tags/queries"
import { findToolById } from "~/server/admin/tools/queries"

export default async function ({ params }: PageProps<"/admin/tools/[id]">) {
  const { id } = await params
  const tool = await findToolById(id)

  if (!tool) {
    return notFound()
  }

  return (
    <Wrapper size="md" gap="sm">
      <ToolForm
        title={`Edit ${tool.name}`}
        tool={tool}
        categoriesPromise={findCategoryList()}
        tagsPromise={findTagList()}
      />
    </Wrapper>
  )
}
