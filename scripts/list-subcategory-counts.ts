#!/usr/bin/env bun
/**
 * List subcategories with published company / funder link counts.
 * Run: bun scripts/list-subcategory-counts.ts
 */
import { db } from "~/services/db"

async function main() {
  const [subcategories, companyGroups, funderGroups] = await Promise.all([
    db.subcategory.findMany({
      select: { id: true, name: true, slug: true },
    }),
    db.companySubcategory.groupBy({
      by: ["subcategoryId"],
      where: { company: { status: "published" } },
      _count: { _all: true },
    }),
    db.funderSubcategory.groupBy({
      by: ["subcategoryId"],
      where: { funder: { status: "published" } },
      _count: { _all: true },
    }),
  ])

  const companyMap = new Map(
    companyGroups.map(g => [g.subcategoryId, g._count._all]),
  )
  const funderMap = new Map(
    funderGroups.map(g => [g.subcategoryId, g._count._all]),
  )

  const rows = subcategories
    .map(s => {
      const companyCount = companyMap.get(s.id) ?? 0
      const funderCount = funderMap.get(s.id) ?? 0
      return {
        name: s.name,
        slug: s.slug,
        companyCount,
        funderCount,
        total: companyCount + funderCount,
      }
    })
    .filter(r => r.total > 0)
    .sort((a, b) => b.total - a.total)

  if (rows.length === 0) {
    console.log("No subcategories with at least one published company or funder link.")
    return
  }

  console.log(
    [
      "name",
      "slug",
      "published_companies",
      "published_funders",
      "total",
    ].join("\t"),
  )
  for (const r of rows) {
    console.log(
      [r.name, r.slug, r.companyCount, r.funderCount, r.total].join("\t"),
    )
  }

  console.log(`\n${rows.length} subcategory(ies) with total count > 0.`)
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
