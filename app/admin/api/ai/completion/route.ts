import { streamText } from "ai"
import { z } from "zod"
import { getCompletionModel, isAIEnabled } from "~/services/ai"

export async function POST(req: Request) {
  if (!isAIEnabled) {
    return Response.json({ error: "AI features are not configured" }, { status: 501 })
  }

  const { prompt } = z.object({ prompt: z.string() }).parse(await req.json())

  const result = streamText({
    model: getCompletionModel(),
    prompt,
  })

  return result.toUIMessageStreamResponse()
}
