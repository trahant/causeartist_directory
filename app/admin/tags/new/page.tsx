import { TagForm } from "~/app/admin/tags/_components/tag-form"
import { Wrapper } from "~/components/common/wrapper"
import { findToolList } from "~/server/admin/tools/queries"

export default function () {
  return (
    <Wrapper size="md" gap="sm">
      <TagForm title="Create tag" toolsPromise={findToolList()} />
    </Wrapper>
  )
}
