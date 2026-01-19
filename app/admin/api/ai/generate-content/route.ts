import { z } from "zod"
import { streamContent } from "~/lib/ai"
import { scrapeWebsiteData } from "~/lib/scraper"
import { isAIEnabled } from "~/services/ai"

export const maxDuration = 60

export async function POST(req: Request) {
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
