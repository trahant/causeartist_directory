import { AuthorForm } from "~/app/admin/authors/_components/author-form"
import { Wrapper } from "~/components/common/wrapper"

export default function () {
  return (
    <Wrapper size="md" gap="sm">
      <AuthorForm title="Create author" />
    </Wrapper>
  )
}
