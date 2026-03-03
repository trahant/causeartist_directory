import { notFound } from "next/navigation"
import { PostForm } from "~/app/admin/posts/_components/post-form"
import { Wrapper } from "~/components/common/wrapper"
import { getServerSession } from "~/lib/auth"
import { findPostById } from "~/server/admin/posts/queries"

export default async function ({ params }: PageProps<"/admin/posts/[id]">) {
  const { id } = await params
  const post = await findPostById(id)

  if (!post) {
    return notFound()
  }

  const session = await getServerSession()

  return (
    <Wrapper size="md" gap="sm">
      <PostForm title={`Edit ${post.title}`} post={post} currentUserId={session?.user.id} />
    </Wrapper>
  )
}
