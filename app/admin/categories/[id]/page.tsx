import { notFound } from "next/navigation"
import { CategoryForm } from "~/app/admin/categories/_components/category-form"
import { Wrapper } from "~/components/common/wrapper"
import { findCategoryById } from "~/server/admin/categories/queries"

export default async function ({ params }: PageProps<"/admin/categories/[id]">) {
  const { id } = await params
  const category = await findCategoryById(id)

  if (!category) {
    return notFound()
  }

  return (
    <Wrapper size="md" gap="sm">
      <CategoryForm title="Update category" category={category} />
    </Wrapper>
  )
}
