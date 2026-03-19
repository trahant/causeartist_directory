import { db } from "~/services/db"

async function main() {
  console.log("Listing distinct Funder.type values (with counts)...")

  const typeCounts = await db.funder.groupBy({
    by: ["type"],
    _count: { _all: true },
  })

  // Normalize output ordering with non-null first, then null.
  typeCounts.sort((a, b) => {
    if (a.type == null && b.type == null) return 0
    if (a.type == null) return 1
    if (b.type == null) return -1
    return String(a.type).localeCompare(String(b.type))
  })

  for (const row of typeCounts) {
    console.log(`- ${row.type ?? "null"}: ${row._count._all}`)
  }

  console.log("\nFunder records where type is null:")
  const nullTypeFunders = await db.funder.findMany({
    where: { type: null },
    select: { name: true },
    orderBy: { name: "asc" },
  })

  for (const f of nullTypeFunders) {
    console.log(`- ${f.name}`)
  }

  console.log(`\nTotal null-type funders: ${nullTypeFunders.length}`)
}

main()
  .catch(e => {
    console.error("Error:", e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })

