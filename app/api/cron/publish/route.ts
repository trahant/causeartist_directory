import { revalidateTag } from "next/cache"
import { after } from "next/server"
import { PostStatus, ToolStatus } from "~/.generated/prisma/client"
import { env } from "~/env"
import { notifySubmitterOfToolPublished } from "~/lib/notifications"
import { db } from "~/services/db"

export const maxDuration = 60

export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 })
  }

  const now = new Date()

  // Fetch scheduled tools and posts in parallel
  const [tools, posts] = await Promise.all([
    db.tool.findMany({
      where: { status: ToolStatus.Scheduled, publishedAt: { lte: now } },
    }),
    db.post.findMany({
      where: { status: PostStatus.Scheduled, publishedAt: { lte: now } },
    }),
  ])

  // Publish scheduled tools
  if (tools.length) {
    console.info(`Publishing ${tools.length} tools`)

    await db.tool.updateMany({
      where: { id: { in: tools.map(t => t.id) } },
      data: { status: ToolStatus.Published },
    })

    for (const tool of tools) {
      revalidateTag(`tool-${tool.slug}`, "infinite")
    }

    revalidateTag("tools", "infinite")
    revalidateTag("schedule", "infinite")

    after(async () => {
      for (const tool of tools) {
        await notifySubmitterOfToolPublished({ ...tool, status: ToolStatus.Published })
      }
    })
  }

  // Publish scheduled posts
  if (posts.length) {
    console.info(`Publishing ${posts.length} posts`)

    await db.post.updateMany({
      where: { id: { in: posts.map(p => p.id) } },
      data: { status: PostStatus.Published },
    })

    for (const post of posts) {
      revalidateTag(`post-${post.slug}`, "infinite")
    }

    revalidateTag("posts", "infinite")
  }

  return Response.json({ success: true })
}
