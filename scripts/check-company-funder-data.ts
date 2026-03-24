#!/usr/bin/env bun
/**
 * Prints company/funder counts and small samples for sanity checks.
 * Run: bun scripts/check-company-funder-data.ts
 */
import { db } from "~/services/db"

async function main() {
  const [publishedCompanies, publishedFunders, companyFunderCount] = await Promise.all([
    db.company.count({ where: { status: "published" } }),
    db.funder.count({ where: { status: "published" } }),
    db.companyFunder.count(),
  ])

  console.log("1. Total published companies:", publishedCompanies)
  console.log("2. Total published funders:", publishedFunders)
  console.log("3. Total CompanyFunder junction records:", companyFunderCount)

  const sampleFunders = await db.funder.findMany({
    where: { status: "published" },
    take: 10,
    orderBy: { name: "asc" },
    select: {
      name: true,
      type: true,
      sectors: { select: { sector: { select: { name: true } } } },
    },
  })

  console.log("\n4. Sample funders (up to 10, published, name asc):")
  if (sampleFunders.length === 0) {
    console.log("   (none)")
  } else {
    for (const f of sampleFunders) {
      const sectorNames = f.sectors.map(s => s.sector.name).join(", ") || "—"
      console.log(`   • ${f.name}`)
      console.log(`     type: ${f.type ?? "—"}`)
      console.log(`     sectors: ${sectorNames}`)
    }
  }

  const sampleCompanies = await db.company.findMany({
    where: { status: "published" },
    take: 10,
    orderBy: { name: "asc" },
    select: {
      name: true,
      sectors: { select: { sector: { select: { name: true } } } },
    },
  })

  console.log("\n5. Sample companies (up to 10, published, name asc):")
  if (sampleCompanies.length === 0) {
    console.log("   (none)")
  } else {
    for (const c of sampleCompanies) {
      const sectorNames = c.sectors.map(s => s.sector.name).join(", ") || "—"
      console.log(`   • ${c.name}`)
      console.log(`     sectors: ${sectorNames}`)
    }
  }
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
