import { db } from "~/services/db"

async function main() {
  console.log("1) Distinct Company.status values with counts")
  const statusCounts = await db.company.groupBy({
    by: ["status"],
    _count: { _all: true },
  })

  statusCounts.sort((a, b) => a.status.localeCompare(b.status))
  for (const row of statusCounts) {
    console.log(`- ${row.status}: ${row._count._all}`)
  }

  console.log("\n2) Company model type field check")
  const companyColumns = await db.$queryRaw<Array<{ column_name: string }>>`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Company'
  `
  const hasTypeField = companyColumns.some(c => c.column_name === "type")
  if (hasTypeField) {
    console.log("- Company.type exists")
  } else {
    console.log('- Company.type field does not exist')
  }

  console.log("\n3) Distinct sector names and company counts")
  const sectorCounts = await db.sector.findMany({
    select: {
      name: true,
      companies: { select: { companyId: true } },
    },
    orderBy: { name: "asc" },
  })

  for (const sector of sectorCounts) {
    console.log(`- ${sector.name}: ${sector.companies.length}`)
  }

  console.log("\n4) Companies where description is null")
  const descriptionNullCount = await db.company.count({
    where: { description: null },
  })
  console.log(`- ${descriptionNullCount}`)

  console.log("\n5) Companies where tagline is null")
  const taglineNullCount = await db.company.count({
    where: { tagline: null },
  })
  console.log(`- ${taglineNullCount}`)
}

main()
  .catch(e => {
    console.error("Error:", e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })

