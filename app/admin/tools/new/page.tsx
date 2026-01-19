import { ToolForm } from "~/app/admin/tools/_components/tool-form"
import { Wrapper } from "~/components/common/wrapper"
import { findCategoryList } from "~/server/admin/categories/queries"
import { findTagList } from "~/server/admin/tags/queries"

export default function () {
  return (
    <Wrapper size="md" gap="sm">
      <ToolForm
        title="Create tool"
        categoriesPromise={findCategoryList()}
        tagsPromise={findTagList()}
      />
    </Wrapper>
  )
}
