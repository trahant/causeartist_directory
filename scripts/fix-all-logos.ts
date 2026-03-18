#!/usr/bin/env node
import { db } from "~/services/db"

function buildGoogleFaviconUrl(hostname: string) {
  return `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`
}

function normalizeWebsite(website: string | null | undefined) {
  return (website ?? "").trim()
}

async function main() {
  let companiesUpdated = 0
  let companiesSkipped = 0
  let fundersUpdated = 0
  let fundersSkipped = 0
  let errors = 0

  const cleanNeedle = "google.com/s2/favicons"

  const companies = await db.company.findMany({
    select: { id: true, name: true, website: true, logoUrl: true },
  })

  for (const company of companies) {
    try {
      const currentLogoUrl = company.logoUrl ?? ""
      if (currentLogoUrl.includes(cleanNeedle)) {
        companiesSkipped++
        continue
      }

      const website = normalizeWebsite(company.website)
      if (!website) {
        companiesSkipped++
        continue
      }

      const hostname = new URL(website).hostname
      const nextLogoUrl = buildGoogleFaviconUrl(hostname)

      await db.company.update({
        where: { id: company.id },
        data: { logoUrl: nextLogoUrl },
      })

      companiesUpdated++
      console.log(`Updated: ${company.name} → ${nextLogoUrl}`)
    } catch (e) {
      errors++
      console.error(`Company logo update failed for id=${company.id}`, e)
    }
  }

  const funders = await db.funder.findMany({
    select: { id: true, name: true, website: true, logoUrl: true },
  })

  for (const funder of funders) {
    try {
      const currentLogoUrl = funder.logoUrl ?? ""
      if (currentLogoUrl.includes(cleanNeedle)) {
        fundersSkipped++
        continue
      }

      const website = normalizeWebsite(funder.website)
      if (!website) {
        fundersSkipped++
        continue
      }

      const hostname = new URL(website).hostname
      const nextLogoUrl = buildGoogleFaviconUrl(hostname)

      await db.funder.update({
        where: { id: funder.id },
        data: { logoUrl: nextLogoUrl },
      })

      fundersUpdated++
      console.log(`Updated: ${funder.name} → ${nextLogoUrl}`)
    } catch (e) {
      errors++
      console.error(`Funder logo update failed for id=${funder.id}`, e)
    }
  }

  console.log("\n--- Totals ---")
  console.log("Companies updated:", companiesUpdated)
  console.log("Companies skipped:", companiesSkipped)
  console.log("Funders updated:", fundersUpdated)
  console.log("Funders skipped:", fundersSkipped)
  console.log("Errors:", errors)
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})

