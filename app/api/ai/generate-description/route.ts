import { z } from "zod"
import { streamDescription } from "~/lib/ai"
import { withAdminAuth } from "~/lib/auth-hoc"
import { isAIEnabled } from "~/services/ai"

export const maxDuration = 60

export const POST = withAdminAuth(async req => {
  if (!isAIEnabled) {
    return Response.json({ error: "AI features are not configured" }, { status: 501 })
  }

  const { prompt, temperature } = z
    .object({ prompt: z.string(), temperature: z.number().default(0.3) })
    .parse(await req.json())

  const result = streamDescription(prompt, temperature)

  return result.toTextStreamResponse()
})
