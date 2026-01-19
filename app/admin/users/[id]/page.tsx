import { notFound } from "next/navigation"
import { UserForm } from "~/app/admin/users/_components/user-form"
import { Wrapper } from "~/components/common/wrapper"
import { findUserById } from "~/server/admin/users/queries"

export default async function ({ params }: PageProps<"/admin/users/[id]">) {
  const { id } = await params
  const user = await findUserById(id)

  if (!user) {
    return notFound()
  }

  return (
    <Wrapper size="md" gap="sm">
      <UserForm title="Update user" user={user} />
    </Wrapper>
  )
}
