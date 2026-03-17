#!/usr/bin/env node
import { db } from "~/services/db"

const slugMap: Record<string, string> = {
  "case-study-fairphone": "fairphone",
  "case-study-patagonia": "patagonia",
  "case-study-seventh-generation": "seventh-generation",
  "case-study-toms-shoes": "toms-shoes",
  "case-study-chobani-yogurt-company": "chobani-yogurt-company",
  "case-study-beyond-meat": "beyond-meat",
  "case-study-allbirds": "allbirds",
  "case-study-warby-parker": "warby-parker",
  "ben-jerrys-case-study": "ben-jerrys",
  "business-case-study-lemonade-insurance": "lemonade-insurance",
  "impact-business-case-study-bombas": "bombas",
  "nonprofit-case-study-give-directly": "give-directly",
  "business-case-study-dr-bronners": "dr-bronners",
  "kiva-nonprofit-case-study": "kiva",
  "eileen-fisher-impact-business-case-study": "eileen-fisher",
  "thrive-market-impact-business-case-study": "thrive-market",
  "aspiration-business-case-study": "aspiration",
  "tonys-chocolonely-case-study": "tonys-chocolonely",
  "grove-collaborative-business-case-study": "grove-collaborative",
}

async function main() {
  let updatedCount = 0
  let notFoundCount = 0
  let errorCount = 0

  for (const [oldSlug, newSlug] of Object.entries(slugMap)) {
    try {
      const existing = await db.caseStudy.findFirst({
        where: { slug: oldSlug },
        select: { id: true, slug: true },
      })

      if (!existing) {
        notFoundCount++
        console.log(`Not found: ${oldSlug}`)
        continue
      }

      await db.caseStudy.update({
        where: { id: existing.id },
        data: { slug: newSlug },
      })

      updatedCount++
      console.log(`Updated: ${oldSlug} → ${newSlug}`)
    } catch (e) {
      errorCount++
      console.error(`Error processing ${oldSlug}:`, e)
    }
  }

  console.log("\n--- Summary ---")
  console.log("Updated count:", updatedCount)
  console.log("Not found count:", notFoundCount)
  console.log("Error count:", errorCount)
}

main().then(
  () => process.exit(0),
  e => {
    console.error(e)
    process.exit(1)
  },
)

