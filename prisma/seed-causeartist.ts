/**
 * Seed only Companies and Funders. Safe to run on an existing DB:
 * uses upsert by slug so records are created if missing or left unchanged.
 *
 * Run: bun prisma/seed-causeartist.ts
 * Or:  bun run db:seed:causeartist (if script is added to package.json)
 */
import { db } from "~/services/db"

const COMPANIES = [
  { name: "Acme Impact", slug: "acme-impact", status: "published" as const, tagline: "Building a better world through sustainable innovation." },
  { name: "Green Future Co", slug: "green-future-co", status: "published" as const, tagline: "Climate solutions for the next decade." },
  { name: "Social Good Labs", slug: "social-good-labs", status: "published" as const, tagline: "Technology that serves people and planet." },
]

const FUNDERS = [
  { name: "Impact Ventures", slug: "impact-ventures", status: "published" as const, type: "vc" },
  { name: "Cause Foundation", slug: "cause-foundation", status: "published" as const, type: "foundation" },
]

async function main() {
  console.log("Seeding Causeartist companies and funders...")

  for (const data of COMPANIES) {
    await db.company.upsert({
      where: { slug: data.slug },
      create: data,
      update: {},
    })
  }
  console.log(`Upserted ${COMPANIES.length} companies.`)

  for (const data of FUNDERS) {
    await db.funder.upsert({
      where: { slug: data.slug },
      create: data,
      update: {},
    })
  }
  console.log(`Upserted ${FUNDERS.length} funders.`)

  console.log("Done.")
}

main()
  .catch(e => {
    console.error("Error:", e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
