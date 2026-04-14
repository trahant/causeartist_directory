import { headers } from "next/headers"
import { z } from "zod"
import { streamDescription } from "~/lib/ai"
import { auth } from "~/lib/auth"
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

  const { prompt, temperature } = z
    .object({ prompt: z.string(), temperature: z.number().default(0.3) })
    .parse(await req.json())

  const result = streamDescription(prompt, temperature)

  return result.toTextStreamResponse()
}
