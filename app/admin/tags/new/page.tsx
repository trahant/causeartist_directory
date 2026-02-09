import { TagForm } from "~/app/admin/tags/_components/tag-form"
import { Wrapper } from "~/components/common/wrapper"

export default function () {
  return (
    <Wrapper size="md" gap="sm">
      <TagForm title="Create tag" />
    </Wrapper>
  )
}
