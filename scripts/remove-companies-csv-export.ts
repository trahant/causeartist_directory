#!/usr/bin/env bun
/**
 * Delete companies listed in scripts/data/removed-companies-csv-slugs.txt
 * (sourced from Company_rows CSV exports — defunct or out of scope).
 *
 * Removes junction rows and case studies, then the Company row.
 *
 *   bun scripts/remove-companies-csv-export.ts
 *   bun scripts/remove-companies-csv-export.ts --dry-run
 */
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import { db } from "~/services/db"

const __dirname = dirname(fileURLToPath(import.meta.url))
const SLUG_FILE = join(__dirname, "data", "removed-companies-csv-slugs.txt")

function loadSlugs(path: string): string[] {
  const text = readFileSync(path, "utf8")
  return text
    .split("\n")
    .map(l => l.trim())
    .filter(l => l.length > 0 && !l.startsWith("#"))
}

async function main() {
  const dryRun = process.argv.includes("--dry-run")
  const slugs = loadSlugs(SLUG_FILE)
  if (slugs.length === 0) {
    console.error("No slugs in", SLUG_FILE)
    process.exit(1)
  }

  const companies = await db.company.findMany({
    where: { slug: { in: slugs } },
    select: { id: true, slug: true, name: true },
    orderBy: { slug: "asc" },
  })

  const foundSlugs = new Set(companies.map(c => c.slug))
  const missing = slugs.filter(s => !foundSlugs.has(s))
  if (missing.length > 0) {
    console.log("Slugs not found in DB (skipped):", missing.join(", "))
  }

  if (companies.length === 0) {
    console.log("No matching companies to delete.")
    process.exit(0)
  }

  console.log(
    `${dryRun ? "[dry-run] Would delete" : "Deleting"} ${companies.length} companies:`,
    companies.map(c => c.slug).join(", "),
  )

  if (dryRun) {
    process.exit(0)
  }

  const ids = companies.map(c => c.id)

  await db.$transaction(async tx => {
    const c = await tx.companyCertification.deleteMany({ where: { companyId: { in: ids } } })
    const l = await tx.companyLocation.deleteMany({ where: { companyId: { in: ids } } })
    const s = await tx.companySector.deleteMany({ where: { companyId: { in: ids } } })
    const u = await tx.companySubcategory.deleteMany({ where: { companyId: { in: ids } } })
    const e = await tx.companyEpisode.deleteMany({ where: { companyId: { in: ids } } })
    const f = await tx.companyFunder.deleteMany({ where: { companyId: { in: ids } } })
    const cs = await tx.caseStudy.deleteMany({ where: { companyId: { in: ids } } })
    const co = await tx.company.deleteMany({ where: { id: { in: ids } } })

    console.log("Deleted rows:", {
      companyCertification: c.count,
      companyLocation: l.count,
      companySector: s.count,
      companySubcategory: u.count,
      companyEpisode: e.count,
      companyFunder: f.count,
      caseStudy: cs.count,
      company: co.count,
    })
  })

  console.log("Done.")
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
