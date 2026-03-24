import { redirect } from "next/navigation"

export default async function ({ params }: PageProps<"/admin/posts/[id]">) {
  const { id } = await params
  redirect(`/admin/blog-posts/${id}`)
}
