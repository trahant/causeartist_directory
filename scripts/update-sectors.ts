import { db } from "~/services/db"

const getSectorForCompany = (subcategorySlugs: string[]): string => {
  if (subcategorySlugs.some(s => ["apparel-footwear", "accessories-jewelry"].includes(s)))
    return "responsible-fashion"
  if (subcategorySlugs.some(s => ["electric-vehicles", "sustainable-transport"].includes(s)))
    return "clean-transportation"
  if (subcategorySlugs.some(s => ["green-building", "homelessness-housing"].includes(s)))
    return "built-environment"
  if (
    subcategorySlugs.some(s =>
      [
        "food-systems",
        "regenerative-ag",
        "food-beverage",
        "sustainable-beverages",
        "ethical-chocolate-snacks",
        "alt-protein-cultivated",
      ].includes(s),
    )
  )
    return "sustainable-food-agriculture"
  if (subcategorySlugs.some(s => ["health-tech", "health-wellness"].includes(s)))
    return "health-wellness"
  if (subcategorySlugs.some(s => ["ed-tech", "youth-education"].includes(s)))
    return "education"
  if (subcategorySlugs.some(s => ["impact-fintech", "giving-fundraising"].includes(s)))
    return "impact-finance"
  if (
    subcategorySlugs.some(s =>
      ["economic-inclusion", "global-development", "workforce-development"].includes(s),
    )
  )
    return "community-development"
  return "community-development"
}

/** Map logical slug from getSectorForCompany to existing Sector.slug in DB */
function resolveDbSectorSlug(logicalSlug: string): string {
  switch (logicalSlug) {
    case "sustainable-food-agriculture":
      return "sustainable-food"
    case "health-wellness":
      return "health"
    default:
      return logicalSlug
  }
}

async function main() {
  let sectorsRenamed = 0
  let sectorsRenameErrors = 0

  let newSectorsCreated = 0
  let newSectorsUpdated = 0
  let newSectorErrors = 0

  let companiesReassigned = 0
  const reassignedPerSector = new Map<string, number>()
  let reassignmentErrors = 0

  console.log("--- STEP 1: Rename existing sectors ---\n")
  const renames: Array<{ slug: string; name: string }> = [
    { slug: "environment", name: "Environment & Conservation" },
    { slug: "sustainable-food", name: "Sustainable Food & Agriculture" },
    { slug: "health", name: "Health & Wellness" },
  ]

  for (const { slug, name } of renames) {
    try {
      await db.sector.update({
        where: { slug },
        data: { name },
      })
      console.log(`Renamed sector [${slug}] → name "${name}"`)
      sectorsRenamed++
    } catch (e) {
      console.error(`Error renaming sector [${slug}]:`, e)
      sectorsRenameErrors++
    }
  }

  console.log("\n--- STEP 2: Add new sectors ---\n")
  const newSectors: Array<{ name: string; slug: string }> = [
    { name: "Responsible Fashion", slug: "responsible-fashion" },
    { name: "Clean Transportation", slug: "clean-transportation" },
    { name: "Built Environment", slug: "built-environment" },
  ]

  for (const sector of newSectors) {
    try {
      const existing = await db.sector.findUnique({ where: { slug: sector.slug } })
      await db.sector.upsert({
        where: { slug: sector.slug },
        update: { name: sector.name },
        create: { name: sector.name, slug: sector.slug },
      })
      if (existing) {
        console.log(`Upserted (updated): ${sector.name} (${sector.slug})`)
        newSectorsUpdated++
      } else {
        console.log(`Upserted (created): ${sector.name} (${sector.slug})`)
        newSectorsCreated++
      }
    } catch (e) {
      console.error(`Error upserting sector [${sector.slug}]:`, e)
      newSectorErrors++
    }
  }

  console.log("\n--- STEP 3: Reassign Social Enterprise companies ---\n")

  let socialEnterpriseSectorId: string | null = null
  try {
    const social = await db.sector.findUnique({
      where: { slug: "social-enterprise" },
      select: { id: true },
    })
    socialEnterpriseSectorId = social?.id ?? null
    if (!socialEnterpriseSectorId) {
      console.log('No sector with slug "social-enterprise" found; skipping reassignments.')
    }
  } catch (e) {
    console.error("Error looking up social-enterprise sector:", e)
    reassignmentErrors++
  }

  type SocialEnterpriseLinkRow = {
    companyId: string
    sectorId: string
    company: {
      id: string
      name: string
      subcategories: Array<{ subcategory: { slug: string } }>
    }
  }

  if (socialEnterpriseSectorId) {
    let links: SocialEnterpriseLinkRow[] = []
    try {
      links = await db.companySector.findMany({
        where: { sectorId: socialEnterpriseSectorId },
        include: {
          company: {
            select: {
              id: true,
              name: true,
              subcategories: {
                select: { subcategory: { select: { slug: true } } },
              },
            },
          },
        },
      })
    } catch (e) {
      console.error("Error loading CompanySector links for social-enterprise:", e)
      reassignmentErrors++
    }

    for (const row of links) {
      const company = row.company
      try {
        const subcategorySlugs = company.subcategories.map(
          (j: { subcategory: { slug: string } }) => j.subcategory.slug,
        )
        const logicalSlug = getSectorForCompany(subcategorySlugs)
        const dbSlug = resolveDbSectorSlug(logicalSlug)

        const newSector = await db.sector.findUnique({
          where: { slug: dbSlug },
        })
        if (!newSector) {
          console.error(
            `No sector found for slug "${dbSlug}" (company: ${company.name})`,
          )
          reassignmentErrors++
          continue
        }

        await db.companySector.upsert({
          where: {
            companyId_sectorId: {
              companyId: company.id,
              sectorId: newSector.id,
            },
          },
          create: {
            companyId: company.id,
            sectorId: newSector.id,
          },
          update: {},
        })

        await db.companySector.delete({
          where: {
            companyId_sectorId: {
              companyId: company.id,
              sectorId: socialEnterpriseSectorId,
            },
          },
        })

        console.log(`Reassigned: ${company.name} → ${newSector.name}`)
        companiesReassigned++
        reassignedPerSector.set(
          newSector.slug,
          (reassignedPerSector.get(newSector.slug) ?? 0) + 1,
        )
      } catch (e) {
        console.error(`Error reassigning company [${company.id}] ${company.name}:`, e)
        reassignmentErrors++
      }
    }
  }

  console.log("\n--- STEP 4: Sector slugs ---")
  console.log(
    "Display names updated; original slugs kept (no URL changes for renamed sectors).\n",
  )

  console.log("--- STEP 5: Summary ---\n")
  console.log(`Sectors renamed: ${sectorsRenamed}`)
  console.log(`Sector rename errors: ${sectorsRenameErrors}`)
  console.log(`New sectors created: ${newSectorsCreated}`)
  console.log(`New sectors updated (already existed): ${newSectorsUpdated}`)
  console.log(`New sector upsert errors: ${newSectorErrors}`)
  console.log(`Companies reassigned from Social Enterprise: ${companiesReassigned}`)
  console.log("Companies reassigned per target sector (slug):")
  const sorted = [...reassignedPerSector.entries()].sort((a, b) =>
    a[0].localeCompare(b[0]),
  )
  if (sorted.length === 0) {
    console.log("  (none)")
  } else {
    for (const [slug, count] of sorted) {
      console.log(`  - ${slug}: ${count}`)
    }
  }
  console.log(`Reassignment / lookup errors: ${reassignmentErrors}`)
}

main()
  .catch(e => {
    console.error("Fatal error:", e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
