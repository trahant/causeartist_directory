import { after } from "next/server"
import { removeS3Directories } from "~/lib/media"
import { withAdmin } from "~/lib/orpc"
import { generateUniqueSlug } from "~/lib/slugs"
import { findPostById, findPostList, findPosts } from "~/server/admin/posts/queries"
import { postListSchema, postSchema } from "~/server/admin/posts/schema"
import { idSchema, idsSchema } from "~/server/admin/shared/schema"

const list = withAdmin.input(postListSchema).handler(async ({ input }) => {
  return findPosts(input)
})

const lookup = withAdmin.handler(async () => {
  return findPostList()
})

const upsert = withAdmin
  .input(postSchema)
  .handler(async ({ input, context: { db, revalidate } }) => {
    const { id, ...data } = input
    const existingPost = id ? await db.post.findUnique({ where: { id } }) : null
    const slug = await generateUniqueSlug(
      data.slug || data.title,
      slug => db.post.findUnique({ where: { slug }, select: { slug: true } }).then(Boolean),
      existingPost?.slug,
    )

    const post = await db.post.upsert({
      where: { id },
      create: {
        id,
        ...data,
        slug,
      },
      update: {
        ...data,
        slug,
      },
    })

    revalidate({
      tags: ["posts", `post-${post.slug}`],
    })

    return post
  })

const duplicate = withAdmin
  .input(idSchema)
  .handler(async ({ input: { id }, context: { db, revalidate, user } }) => {
    const post = await findPostById(id)

    if (!post) {
      throw new Error("Post not found")
    }

    const title = `${post.title} (Copy)`

    const slug = await generateUniqueSlug(title, slug =>
      db.post.findUnique({ where: { slug }, select: { slug: true } }).then(Boolean),
    )

    const newPost = await db.post.create({
      data: {
        title,
        slug,
        description: post.description,
        content: post.content,
        plainText: post.plainText,
        imageUrl: post.imageUrl,
        authorId: user.id,
      },
    })

    revalidate({
      tags: ["posts"],
    })

    return newPost
  })

const remove = withAdmin
  .input(idsSchema)
  .handler(async ({ input: { ids }, context: { db, revalidate } }) => {
    await db.post.deleteMany({
      where: { id: { in: ids } },
    })

    after(async () => {
      await removeS3Directories(ids.map(id => `posts/${id}`))
    })

    revalidate({
      tags: ["posts"],
    })

    return true
  })

export const postRouter = {
  list,
  lookup,
  upsert,
  duplicate,
  remove,
}
