import { headers } from "next/headers"
import { z } from "zod"
import { streamContent } from "~/lib/ai"
import { auth } from "~/lib/auth"
import { scrapeWebsiteData } from "~/lib/scraper"
import { isAIEnabled } from "~/services/ai"

export const maxDuration = 60

export async function POST(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (session.user.role !== "admin") {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  if (!isAIEnabled) {
    return Response.json({ error: "AI features are not configured" }, { status: 501 })
  }

  const { url, temperature } = z
    .object({ url: z.url(), temperature: z.number().default(0.3) })
    .parse(await req.json())

  const data = await scrapeWebsiteData(url)
  const result = streamContent(data, temperature)

  return result.toTextStreamResponse()
}
