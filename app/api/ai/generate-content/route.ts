import { Output, streamText } from "ai"
import { z } from "zod"
import { withAdminAuth } from "~/lib/auth-hoc"
import { scrapeWebsiteData } from "~/lib/scraper"
import { contentSchema as schema } from "~/server/admin/shared/schema"
import { getChatModel, isAIEnabled } from "~/services/ai"

export const maxDuration = 60

export const POST = withAdminAuth(async req => {
  if (!isAIEnabled) {
    return Response.json({ error: "AI features are not configured" }, { status: 501 })
  }

  const { url, temperature } = z
    .object({
      url: z.url(),
      temperature: z.number().default(0.3),
    })
    .parse(await req.json())

  const scrapedData = await scrapeWebsiteData(url)

  const result = streamText({
    model: getChatModel(),
    output: Output.object({ schema }),
    system: `
      You are an expert content creator specializing in reasearching and writing about tools.
      Your task is to generate high-quality, engaging content to display on a directory website.
      You do not use any catchphrases like "Empower", "Streamline" etc.
    `,
    temperature,
    prompt: `
      Provide me details for the following data:
      Title: ${scrapedData.title}
      Description: ${scrapedData.description}
      Content: ${scrapedData.content}
    `,
    onError: error => {
      console.error(error)
      throw error
    },
  })

  return result.toTextStreamResponse()
})
