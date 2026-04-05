#!/usr/bin/env bun
/**
 * Data completeness summary for published Company records.
 * Run: bun scripts/audit-company-profiles.ts
 *
 * Item 10: non-null, non-empty descriptions with TRIM length < 100 (avoids overlap with #3).
 */
import { db } from "~/services/db"

const published = { status: "published" as const }

function missingStringField(field: "logoUrl" | "description" | "tagline" | "website") {
  return {
    ...published,
    OR: [{ [field]: null }, { [field]: "" }],
  }
}

async function main() {
  const [
    totalPublished,
    missingLogoUrl,
    missingDescription,
    missingTagline,
    missingWebsite,
    missingSectors,
    missingLocations,
    missingFoundedYear,
    missingFounderName,
    withCertification,
    withSubcategory,
    rawStats,
  ] = await Promise.all([
    db.company.count({ where: published }),
    db.company.count({ where: missingStringField("logoUrl") }),
    db.company.count({ where: missingStringField("description") }),
    db.company.count({ where: missingStringField("tagline") }),
    db.company.count({ where: missingStringField("website") }),
    db.company.count({
      where: { ...published, sectors: { none: {} } },
    }),
    db.company.count({
      where: { ...published, locations: { none: {} } },
    }),
    db.company.count({
      where: { ...published, foundedYear: null },
    }),
    db.company.count({
      where: { ...published, founderName: null },
    }),
    db.company.count({
      where: { ...published, certifications: { some: {} } },
    }),
    db.company.count({
      where: { ...published, subcategories: { some: {} } },
    }),
    db.$queryRaw<Array<{ avg_desc_len: number | null; thin_description: bigint }>>`
      SELECT
        AVG(LENGTH("description")) FILTER (WHERE "description" IS NOT NULL)::float AS avg_desc_len,
        COUNT(*) FILTER (
          WHERE "description" IS NOT NULL
            AND TRIM("description") <> ''
            AND LENGTH(TRIM("description")) < 100
        )::bigint AS thin_description
      FROM "Company"
      WHERE status = 'published'
    `,
  ])

  const { avg_desc_len: avgDescLen, thin_description: thinDescription } = rawStats[0]!

  console.log("Published Company profile audit\n")
  console.log("1. Total published companies:", totalPublished)
  console.log("2. Companies missing logoUrl (null or empty):", missingLogoUrl)
  console.log("3. Companies missing description (null or empty):", missingDescription)
  console.log("4. Companies missing tagline (null or empty):", missingTagline)
  console.log("5. Companies missing website (null or empty):", missingWebsite)
  console.log("6. Companies missing sectors (no CompanySector records):", missingSectors)
  console.log("7. Companies missing locations (no CompanyLocation records):", missingLocations)
  console.log("8. Companies missing foundedYear (null):", missingFoundedYear)
  console.log("9. Companies missing founderName (null):", missingFounderName)
  console.log(
    "10. Companies with description shorter than 100 characters:",
    Number(thinDescription),
  )
  console.log("")
  console.log(
    "Average description length (characters, non-null descriptions only):",
    avgDescLen == null ? "n/a" : Number(avgDescLen.toFixed(2)),
  )
  console.log("Companies with at least one certification:", withCertification)
  console.log("Companies with at least one subcategory:", withSubcategory)
}

main()
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
