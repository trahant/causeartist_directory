import { google } from "@ai-sdk/google"
import { Output, streamText } from "ai"
import { z } from "zod"
import { withAdminAuth } from "~/lib/auth-hoc"
import { descriptionSchema } from "~/server/admin/shared/schema"

export const maxDuration = 60

export const POST = withAdminAuth(async req => {
  const { prompt, temperature } = z
    .object({
      prompt: z.string(),
      temperature: z.number().default(0.3),
    })
    .parse(await req.json())

  const result = streamText({
    model: google("gemini-2.5-pro"),
    output: Output.object({ schema: descriptionSchema }),
    system: `
      You are an expert content creator specializing in reasearching and writing about tools.
      Your task is to generate high-quality, engaging content to display on a directory website.
      DO NOT use catchphrases like "Empower", "Streamline" etc.
    `,
    temperature,
    prompt,
    onError: error => {
      console.error(error)
      throw error
    },
  })

  return result.toTextStreamResponse()
})
