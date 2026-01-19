import { revalidateTag } from "next/cache"
import { after } from "next/server"
import { ToolStatus } from "~/.generated/prisma/client"
import { env } from "~/env"
import { notifySubmitterOfToolPublished } from "~/lib/notifications"
import { db } from "~/services/db"

export const maxDuration = 60

export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 })
  }

  const tools = await db.tool.findMany({
    where: {
      status: ToolStatus.Scheduled,
      publishedAt: { lte: new Date() },
    },
  })

  if (tools.length) {
    console.info(`Publishing ${tools.length} tools`, { tools })

    for (const tool of tools) {
      const updatedTool = await db.tool.update({
        where: { id: tool.id },
        data: { status: ToolStatus.Published },
      })

      // Revalidate the tool
      revalidateTag(`tool-${updatedTool.slug}`, "infinite")

      // Notify the submitter of the tool published
      after(async () => await notifySubmitterOfToolPublished(updatedTool))
    }

    // Revalidate cache
    revalidateTag("tools", "infinite")
    revalidateTag("schedule", "infinite")
  }

  // Disconnect from DB
  await db.$disconnect()

  // Return success
  return Response.json({ success: true })
}
