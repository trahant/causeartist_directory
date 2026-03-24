import { notFound } from "next/navigation"
import { AuthorForm } from "~/app/admin/authors/_components/author-form"
import { Wrapper } from "~/components/common/wrapper"
import { findAuthorByIdForAdmin } from "~/server/admin/authors/queries"

export default async function ({ params }: PageProps<"/admin/authors/[id]">) {
  const { id } = await params
  const author = await findAuthorByIdForAdmin(id)
  if (!author) notFound()
  return (
    <Wrapper size="md" gap="sm">
      <AuthorForm title={`Edit: ${author.name}`} author={author} />
    </Wrapper>
  )
}
