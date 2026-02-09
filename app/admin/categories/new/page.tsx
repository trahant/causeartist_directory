import { CategoryForm } from "~/app/admin/categories/_components/category-form"
import { Wrapper } from "~/components/common/wrapper"

export default function () {
  return (
    <Wrapper size="md" gap="sm">
      <CategoryForm title="Create category" />
    </Wrapper>
  )
}
