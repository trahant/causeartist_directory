import { db } from "~/services/db"

const certificationSignals: Record<string, string[]> = {
  "b-corp": ["b corp", "b corporation", "bcorp", "certified b", "bcorporation.net"],
  "fair-trade": ["fair trade", "fairtrade", "fair-trade certified"],
  "one-percent-for-the-planet": [
    "1% for the planet",
    "one percent for the planet",
    "onepercentfortheplanet",
  ],
  "carbon-neutral": ["carbon neutral", "carbon-neutral", "net zero", "netzero"],
  "gots-certified": ["gots certified", "global organic textile"],
  "rainforest-alliance": ["rainforest alliance", "rainforest-alliance"],
  "usda-organic": ["usda organic", "certified organic", "usda certified"],
  "leaping-bunny": ["leaping bunny", "cruelty-free", "cruelty free"],
  "climate-neutral": ["climate neutral", "climateneutral"],
  "fsc-certified": ["fsc certified", "fsc®", "forest stewardship"],
  "cradle-to-cradle": ["cradle to cradle", "c2c certified"],
  "benefit-corporation": ["benefit corporation", "public benefit corporation", "pbc"],
  "living-wage-certified": ["living wage certified", "living wage employer"],
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function fetchHtmlText(url: string, timeoutMs = 10_000): Promise<string> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(url, { signal: controller.signal })
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`)
    }
    return await res.text()
  } finally {
    clearTimeout(timeout)
  }
}

async function main() {
  const companies = await db.company.findMany({
    where: {
      status: "published",
      website: { not: null },
    },
    select: {
      id: true,
      name: true,
      website: true,
    },
    orderBy: { name: "asc" },
  })

  let companiesChecked = 0
  let companiesWithAtLeastOne = 0
  let totalAssignmentsMade = 0
  let failedFetches = 0
  const perCertificationCount: Record<string, number> = {}

  for (const company of companies) {
    if (!company.website) continue

    try {
      companiesChecked++
      const html = await fetchHtmlText(company.website, 10_000)
      const lowerText = html.toLowerCase()

      let foundForCompany = false

      for (const [slug, signals] of Object.entries(certificationSignals)) {
        const found = signals.some(signal => lowerText.includes(signal.toLowerCase()))
        if (!found) continue

        const cert = await db.certification.findUnique({
          where: { slug },
          select: { id: true, name: true },
        })
        if (!cert) continue

        await db.companyCertification
          .create({
            data: {
              companyId: company.id,
              certificationId: cert.id,
            },
          })
          .then(() => {
            totalAssignmentsMade++
            perCertificationCount[slug] = (perCertificationCount[slug] ?? 0) + 1
            console.log(`Found ${cert.name} for ${company.name}`)
          })
          .catch(() => {
            // If relation already exists, skip silently.
          })

        foundForCompany = true
      }

      if (foundForCompany) {
        companiesWithAtLeastOne++
      }
    } catch (e) {
      failedFetches++
      console.error(`Failed fetch for ${company.name} (${company.website})`, e)
    }

    await delay(1000)
  }

  console.log("\n--- Summary ---")
  console.log(`Companies checked: ${companiesChecked}`)
  console.log(`Companies with at least one certification found: ${companiesWithAtLeastOne}`)
  console.log(`Total certification assignments made: ${totalAssignmentsMade}`)
  console.log("Count per certification type:")
  for (const slug of Object.keys(certificationSignals)) {
    console.log(`- ${slug}: ${perCertificationCount[slug] ?? 0}`)
  }
  console.log(`Failed fetches: ${failedFetches}`)
}

main()
  .catch(e => {
    console.error("Error:", e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })

