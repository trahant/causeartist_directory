import { CategoryForm } from "~/app/admin/categories/_components/category-form"
import { Wrapper } from "~/components/common/wrapper"
import { findToolList } from "~/server/admin/tools/queries"

export default function () {
  return (
    <Wrapper size="md" gap="sm">
      <CategoryForm title="Create category" toolsPromise={findToolList()} />
    </Wrapper>
  )
}
