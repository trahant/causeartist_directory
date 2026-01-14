import { generateText, Output, streamText } from "ai"
import type { ScrapedData } from "~/lib/scraper"
import { contentSchema, descriptionSchema } from "~/server/admin/shared/schema"
import { getChatModel } from "~/services/ai"

const CONTENT_SYSTEM_PROMPT = `
  You are an expert content creator specializing in researching and writing about software tools.
  Your task is to generate high-quality, engaging content to display on a directory website.
  You do not use any catchphrases like "Empower", "Streamline" etc.
`

/**
 * Streams content generation - use for API routes with useObject client
 */
export const streamContent = (data: ScrapedData, temperature = 0.3) => {
  return streamText({
    model: getChatModel(),
    output: Output.object({ schema: contentSchema }),
    system: CONTENT_SYSTEM_PROMPT,
    temperature,
    prompt: `
      Provide me details for the following data:
      Title: ${data.title}
      Description: ${data.description}
      Content: ${data.content}
    `,
  })
}

/**
 * Awaitable content generation - use for server-side code
 */
export const generateContent = async (data: ScrapedData, temperature = 0.3) => {
  try {
    const { output } = await generateText({
      model: getChatModel(),
      output: Output.object({ schema: contentSchema }),
      system: CONTENT_SYSTEM_PROMPT,
      temperature,
      prompt: `
        Provide me details for the following data:
        Title: ${data.title}
        Description: ${data.description}
        Content: ${data.content}
      `,
    })

    return output
  } catch (error) {
    console.error("Content generation failed:", error)
    return null
  }
}

/**
 * Streams description generation - use for API routes with useObject client
 */
export const streamDescription = (prompt: string, temperature = 0.3) => {
  return streamText({
    model: getChatModel(),
    output: Output.object({ schema: descriptionSchema }),
    system: CONTENT_SYSTEM_PROMPT,
    temperature,
    prompt,
  })
}

/**
 * Awaitable description generation - use for server-side code
 */
export const generateDescription = async (prompt: string, temperature = 0.3) => {
  try {
    const { output } = await generateText({
      model: getChatModel(),
      output: Output.object({ schema: descriptionSchema }),
      system: CONTENT_SYSTEM_PROMPT,
      temperature,
      prompt,
    })

    return output
  } catch (error) {
    console.error("Description generation failed:", error)
    return null
  }
}
