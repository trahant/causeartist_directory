import { db } from "~/services/db"

async function main() {
  console.log("1) Sectors (name, slug, company count)")
  const sectors = await db.sector.findMany({
    select: {
      name: true,
      slug: true,
      _count: { select: { companies: true } },
    },
    orderBy: { name: "asc" },
  })
  for (const s of sectors) {
    console.log(`- ${s.name} (${s.slug}): ${s._count.companies}`)
  }
  if (sectors.length === 0) {
    console.log("- (none)")
  }

  console.log("\n2) Subcategories (name, slug, company count)")
  const subcategories = await db.subcategory.findMany({
    select: {
      name: true,
      slug: true,
      _count: { select: { companies: true } },
    },
    orderBy: { name: "asc" },
  })
  for (const sc of subcategories) {
    console.log(`- ${sc.name} (${sc.slug}): ${sc._count.companies}`)
  }
  if (subcategories.length === 0) {
    console.log("- (none)")
  }

  console.log("\n3) Companies with no sector assigned")
  const noSectorCount = await db.company.count({
    where: { sectors: { none: {} } },
  })
  console.log(`- ${noSectorCount}`)
}

main()
  .catch(e => {
    console.error("Error:", e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
