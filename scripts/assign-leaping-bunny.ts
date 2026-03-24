#!/usr/bin/env bun
/**
 * Assigns the Leaping Bunny certification to a fixed list of companies by name.
 * Run: bun scripts/assign-leaping-bunny.ts
 */
import { db } from "~/services/db"

const leapingBunnyBrands = [
  "Andalou Naturals",
  "Earth Mama Organics",
  "Wander Beauty",
  "Lashify",
  "Thrive Causemetics",
  "NUDESTIX",
  "Versed",
  "Peach & Lily",
  "Live Tinted",
  "Good Molecules",
  "Cocokind",
  "Three Ships",
] as const

async function main() {
  const cert = await db.certification.findUnique({
    where: { slug: "leaping-bunny" },
    select: { id: true, name: true },
  })

  if (!cert) {
    console.error(
      'Certification with slug "leaping-bunny" not found. Run seed-certifications or create it first.',
    )
    process.exit(1)
  }

  let assigned = 0
  let notFound = 0
  let alreadyHad = 0
  let errors = 0

  for (const brandName of leapingBunnyBrands) {
    try {
      const company = await db.company.findFirst({
        where: { name: { contains: brandName, mode: "insensitive" } },
        select: { id: true, name: true, status: true },
      })

      if (!company) {
        notFound++
        console.log(`Not found: ${brandName}`)
        continue
      }

      const existing = await db.companyCertification.findUnique({
        where: {
          companyId_certificationId: {
            companyId: company.id,
            certificationId: cert.id,
          },
        },
        select: { companyId: true },
      })

      if (existing) {
        alreadyHad++
        console.log(`Already had Leaping Bunny: ${company.name}`)
      } else {
        await db.companyCertification.upsert({
          where: {
            companyId_certificationId: {
              companyId: company.id,
              certificationId: cert.id,
            },
          },
          update: {},
          create: {
            companyId: company.id,
            certificationId: cert.id,
          },
        })
        assigned++
        console.log(`Assigned Leaping Bunny to: ${company.name}`)
      }

      if (company.status !== "published") {
        await db.company.update({
          where: { id: company.id },
          data: { status: "published" },
        })
        console.log(`  → Set status to published: ${company.name}`)
      }
    } catch (e) {
      errors++
      console.error(`Error processing "${brandName}":`, e)
    }
  }

  console.log("\n--- Summary ---")
  console.log("Assigned count:", assigned)
  console.log("Not found count:", notFound)
  console.log("Already had certification count:", alreadyHad)
  console.log("Errors:", errors)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
