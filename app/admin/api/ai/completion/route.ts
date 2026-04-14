import { streamText } from "ai"
import { headers } from "next/headers"
import { z } from "zod"
import { auth } from "~/lib/auth"
import { getCompletionModel, isAIEnabled } from "~/services/ai"

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

  const { prompt } = z.object({ prompt: z.string() }).parse(await req.json())

  const result = streamText({
    model: getCompletionModel(),
    prompt,
  })

  return result.toUIMessageStreamResponse()
}
