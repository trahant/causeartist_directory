import { PostForm } from "~/app/admin/posts/_components/post-form"
import { Wrapper } from "~/components/common/wrapper"
import { getServerSession } from "~/lib/auth"

export default async function () {
  const session = await getServerSession()

  return (
    <Wrapper size="md" gap="sm">
      <PostForm title="Create post" currentUserId={session?.user.id} />
    </Wrapper>
  )
}
