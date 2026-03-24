import { notFound } from "next/navigation"
import { BlogPostForm } from "~/app/admin/blog-posts/_components/blog-post-form"
import { Wrapper } from "~/components/common/wrapper"
import { findBlogPostByIdForAdmin } from "~/server/admin/blog-posts/queries"

export default async function ({ params }: PageProps<"/admin/blog-posts/[id]">) {
  const { id } = await params
  const post = await findBlogPostByIdForAdmin(id)
  if (!post) notFound()

  return (
    <Wrapper size="md" gap="sm">
      <BlogPostForm title={`Edit: ${post.title}`} post={post} />
    </Wrapper>
  )
}
