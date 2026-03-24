import { BlogPostForm } from "~/app/admin/blog-posts/_components/blog-post-form"
import { Wrapper } from "~/components/common/wrapper"

export default function () {
  return (
    <Wrapper size="md" gap="sm">
      <BlogPostForm title="Create blog post" />
    </Wrapper>
  )
}
