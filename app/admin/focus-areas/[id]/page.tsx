import { notFound } from "next/navigation"
import { SubcategoryForm } from "~/app/admin/focus-areas/_components/subcategory-form"
import { Wrapper } from "~/components/common/wrapper"
import { findSubcategoryByIdForAdmin } from "~/server/admin/subcategories/queries"

export default async function ({ params }: PageProps<"/admin/focus-areas/[id]">) {
  const { id } = await params
  const subcategory = await findSubcategoryByIdForAdmin(id)
  if (!subcategory) notFound()
  return (
    <Wrapper size="md" gap="sm">
      <SubcategoryForm title={`Edit: ${subcategory.name}`} subcategory={subcategory} />
    </Wrapper>
  )
}
