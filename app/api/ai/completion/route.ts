import { streamText } from "ai"
import { z } from "zod"
import { withAdminAuth } from "~/lib/auth-hoc"
import { getCompletionModel, isAIEnabled } from "~/services/ai"

export const POST = withAdminAuth(async req => {
  if (!isAIEnabled) {
    return Response.json({ error: "AI features are not configured" }, { status: 501 })
  }

  const { prompt } = z.object({ prompt: z.string() }).parse(await req.json())

  const result = streamText({
    model: getCompletionModel(),
    prompt,
  })

  return result.toUIMessageStreamResponse()
})
