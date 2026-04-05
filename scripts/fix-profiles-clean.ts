#!/usr/bin/env bun
/**
 * Targeted company profile fixes (logos, taglines, descriptions).
 * Requires ANTHROPIC_API_KEY for passes 2–3.
 * Run: bun scripts/fix-profiles-clean.ts
 */
import { db } from "~/services/db"

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages"
const MODEL = "claude-sonnet-4-20250514"
const INPUT_TOKEN_PRICE = 0.000003
const OUTPUT_TOKEN_PRICE = 0.000015

type PassErrors = { count: number; samples: string[] }

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function recordError(errors: PassErrors, message: string) {
  errors.count++
  if (errors.samples.length < 8) errors.samples.push(message)
}

function parseJsonObject(text: string): Record<string, unknown> | null {
  let raw = text.trim()
  if (raw.startsWith("```")) {
    raw = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "")
  }
  try {
    const obj = JSON.parse(raw) as Record<string, unknown>
    return obj && typeof obj === "object" ? obj : null
  } catch {
    return null
  }
}

type Usage = { inputTokens: number; outputTokens: number }

async function anthropicMessages(
  userMessage: string,
  maxTokens: number,
): Promise<{ text: string; usage: Usage }> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error("Missing ANTHROPIC_API_KEY")

  const response = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      messages: [{ role: "user", content: userMessage }],
    }),
  })

  const data: unknown = await response.json().catch(() => null)
  const parsed = data as {
    content?: Array<{ type?: string; text?: string }>
    usage?: { input_tokens?: number; output_tokens?: number }
  } | null

  const usage: Usage = {
    inputTokens: parsed?.usage?.input_tokens ?? 0,
    outputTokens: parsed?.usage?.output_tokens ?? 0,
  }

  if (!response.ok) {
    const errText =
      typeof data === "object" && data !== null && "error" in data
        ? JSON.stringify((data as { error?: unknown }).error)
        : JSON.stringify(data)
    throw new Error(`Anthropic API error ${response.status}: ${errText}`)
  }

  const block = parsed?.content?.[0]
  const jsonText = block?.type === "text" ? block.text : block?.text
  return {
    text: typeof jsonText === "string" ? jsonText : "",
    usage,
  }
}

function hostnameFromWebsite(website: string): string {
  const w = website.trim()
  const withProto = /^https?:\/\//i.test(w) ? w : `https://${w}`
  return new URL(withProto).hostname
}

function costFromTokens(input: number, output: number): number {
  return input * INPUT_TOKEN_PRICE + output * OUTPUT_TOKEN_PRICE
}

async function main() {
  const pass1Errors: PassErrors = { count: 0, samples: [] }
  const pass2Errors: PassErrors = { count: 0, samples: [] }
  const pass3Errors: PassErrors = { count: 0, samples: [] }

  let logosFixed = 0
  let taglinesFixed = 0
  let descriptionsFixed = 0

  let pass2ApiCalls = 0
  let pass2InputTokens = 0
  let pass2OutputTokens = 0

  let pass3ApiCalls = 0
  let pass3InputTokens = 0
  let pass3OutputTokens = 0

  // --- PASS 1 ---
  const companiesNeedingLogos = await db.company.findMany({
    where: {
      status: "published",
      website: { not: null },
      OR: [{ logoUrl: null }, { logoUrl: "" }],
    },
    select: { id: true, name: true, website: true },
  })

  console.log(
    `Pass 1: Found ${companiesNeedingLogos.length} companies needing logos`,
  )

  for (const company of companiesNeedingLogos) {
    try {
      const w = company.website?.trim()
      if (!w) {
        recordError(pass1Errors, `${company.name}: empty website`)
        continue
      }
      const domain = hostnameFromWebsite(w)
      const logoUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`
      await db.company.update({
        where: { id: company.id },
        data: { logoUrl },
      })
      logosFixed++
      console.log(`Logo fixed: ${company.name}`)
    } catch (e) {
      recordError(
        pass1Errors,
        `${company.name}: ${e instanceof Error ? e.message : String(e)}`,
      )
      console.error(`Pass 1 error (${company.name}):`, e)
    }
  }

  // --- PASS 2 ---
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("\nSkipping passes 2–3: ANTHROPIC_API_KEY is not set.\n")
  } else {
    const companiesNeedingTaglines = await db.company.findMany({
      where: {
        status: "published",
        website: { not: null },
        OR: [{ tagline: null }, { tagline: "" }],
      },
      select: { id: true, name: true, website: true, description: true },
    })

    console.log(
      `Pass 2: Found ${companiesNeedingTaglines.length} companies needing taglines`,
    )

    for (let i = 0; i < companiesNeedingTaglines.length; i++) {
      const company = companiesNeedingTaglines[i]!
      try {
        const w = company.website?.trim()
        if (!w) {
          recordError(pass2Errors, `${company.name}: empty website`)
          continue
        }

        const content = `Write a tagline for this impact company.
  
Company: ${company.name}
Website: ${company.website}
${company.description ? `Description: ${company.description.slice(0, 300)}` : ""}

Return ONLY a JSON object:
{
  "tagline": "One compelling sentence, maximum 15 words, 
    describing what they do and their positive impact"
}

Base this on your knowledge of the company or their description.`

        const { text, usage } = await anthropicMessages(content, 200)
        pass2ApiCalls++
        pass2InputTokens += usage.inputTokens
        pass2OutputTokens += usage.outputTokens

        const obj = parseJsonObject(text)
        const tagline =
          obj && typeof obj.tagline === "string" ? obj.tagline.trim() : ""
        if (!tagline) {
          recordError(pass2Errors, `${company.name}: no tagline in response`)
          continue
        }

        await db.company.update({
          where: { id: company.id },
          data: { tagline },
        })
        taglinesFixed++
        console.log(`Tagline fixed: ${company.name} → ${tagline}`)
      } catch (e) {
        recordError(
          pass2Errors,
          `${company.name}: ${e instanceof Error ? e.message : String(e)}`,
        )
        console.error(`Pass 2 error (${company.name}):`, e)
      }
      await delay(1000)
    }

    // --- PASS 3 ---
    const publishedWithWebsite = await db.company.findMany({
      where: {
        status: "published",
        website: { not: null },
      },
      select: { id: true, name: true, website: true, description: true },
    })

    const companiesNeedingDescriptions = publishedWithWebsite.filter(
      c => !c.description || c.description.length < 100,
    )

    console.log(
      `Pass 3: Found ${companiesNeedingDescriptions.length} companies needing descriptions (null or length < 100)`,
    )

    for (let i = 0; i < companiesNeedingDescriptions.length; i++) {
      const company = companiesNeedingDescriptions[i]!
      try {
        const w = company.website?.trim()
        if (!w) {
          recordError(pass3Errors, `${company.name}: empty website`)
          continue
        }

        const content = `Write a company description for ${company.name} (${company.website}).

Using your knowledge of this company write 3 paragraphs separated by \\n\\n:
Paragraph 1: What they do and their products/services (2-3 sentences)
Paragraph 2: Their mission and why they exist (2-3 sentences)
Paragraph 3: Their impact on the world (2-3 sentences)

Minimum 150 words total.
Write in third person.
If you have no knowledge of this company return: {"description": null}

Return ONLY JSON: {"description": "..."}`

        const { text, usage } = await anthropicMessages(content, 800)
        pass3ApiCalls++
        pass3InputTokens += usage.inputTokens
        pass3OutputTokens += usage.outputTokens

        const obj = parseJsonObject(text)
        const desc = obj?.description
        if (desc === null || desc === undefined) continue
        if (typeof desc !== "string" || !desc.trim()) continue

        await db.company.update({
          where: { id: company.id },
          data: { description: desc.trim() },
        })
        descriptionsFixed++
        console.log(`Description fixed: ${company.name}`)
      } catch (e) {
        recordError(
          pass3Errors,
          `${company.name}: ${e instanceof Error ? e.message : String(e)}`,
        )
        console.error(`Pass 3 error (${company.name}):`, e)
      }
      await delay(1500)
    }
  }

  const pass2Cost = costFromTokens(pass2InputTokens, pass2OutputTokens)
  const pass3Cost = costFromTokens(pass3InputTokens, pass3OutputTokens)
  const totalCost = pass2Cost + pass3Cost

  console.log("\n--- Summary ---")
  console.log(`Pass 1: Logos fixed: ${logosFixed}`)
  console.log(
    `Pass 2: Taglines fixed: ${taglinesFixed}, API calls: ${pass2ApiCalls}, cost: $${pass2Cost.toFixed(4)}`,
  )
  console.log(
    `Pass 3: Descriptions fixed: ${descriptionsFixed}, API calls: ${pass3ApiCalls}, cost: $${pass3Cost.toFixed(4)}`,
  )
  console.log(`Total cost: $${totalCost.toFixed(4)}`)
  console.log("\nErrors per pass:")
  for (const [label, err] of [
    ["Pass 1", pass1Errors],
    ["Pass 2", pass2Errors],
    ["Pass 3", pass3Errors],
  ] as const) {
    console.log(`  ${label}: ${err.count}`)
    for (const s of err.samples) console.log(`    - ${s}`)
  }
}

main()
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
