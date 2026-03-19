import { db } from "~/services/db"

const validTypes = [
  "vc",
  "foundation",
  "accelerator",
  "family-office",
  "cdfi",
  "impact-fund",
  "fellowship",
  "corporate",
] as const

const validTypeSet = new Set<string>(validTypes)

async function classifyOneFunder({
  name,
  website,
  anthropicApiKey,
}: {
  name: string
  website: string | null
  anthropicApiKey: string
}): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": anthropicApiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 50,
      messages: [
        {
          role: "user",
          content: `Classify this impact funder into exactly one of these types:
vc, foundation, accelerator, family-office, cdfi, impact-fund, fellowship, corporate

Funder name: ${name}
Website: ${website ?? "unknown"}

Reply with ONLY the type slug, nothing else. No explanation.`,
        },
      ],
    }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`Anthropic error: HTTP ${res.status} ${res.statusText} ${text}`.trim())
  }

  const data: unknown = await res.json()
  const parsed = data as {
    content?: { text?: string }[]
  }

  const rawType = parsed.content?.[0]?.text ?? ""
  const normalized = rawType.trim().toLowerCase()

  if (validTypeSet.has(normalized)) return normalized
  return "impact-fund"
}

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function main() {
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY
  if (!anthropicApiKey) {
    throw new Error("Missing required env var ANTHROPIC_API_KEY")
  }

  const funders = await db.funder.findMany({
    where: { type: null },
    select: { id: true, name: true, website: true },
  })

  console.log(`Found ${funders.length} funders with type=null`)

  const countsByType: Record<string, number> = {}
  let totalClassified = 0
  let errors = 0

  for (const funder of funders) {
    try {
      const classifiedType = await classifyOneFunder({
        name: funder.name,
        website: funder.website,
        anthropicApiKey,
      })

      await db.funder.update({
        where: { id: funder.id },
        data: { type: classifiedType },
      })

      totalClassified++
      countsByType[classifiedType] = (countsByType[classifiedType] ?? 0) + 1

      console.log(`Classified: ${funder.name} → ${classifiedType}`)
    } catch (e) {
      errors++
      console.error(`Failed to classify: ${funder.name}`, e)
    }

    // Rate limit between API calls
    await delay(1000)
  }

  console.log("\n--- Summary ---")
  console.log(`Total classified: ${totalClassified}`)
  for (const t of validTypes) {
    console.log(`- ${t}: ${countsByType[t] ?? 0}`)
  }
  console.log(`Errors: ${errors}`)
}

main()
  .catch(e => {
    console.error("Error:", e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })

