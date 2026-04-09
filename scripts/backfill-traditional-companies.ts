#!/usr/bin/env bun
/**
 * Sets `isTraditionalCompany` for known incumbent brand names (case-insensitive;
 * apostrophe variants normalized). Skips companies not in the DB.
 */
import { db } from "~/services/db"

const INCUMBENT_BRANDS = [
  "Nike",
  "Adidas",
  "Puma",
  "Reebok",
  "Under Armour",
  "H&M",
  "Zara",
  "Old Navy",
  "Gap",
  "Levi's",
  "Uniqlo",
  "Shein",
  "Lululemon",
  "The North Face",
  "Patagonia",
  "Columbia",
  "Converse",
  "Vans",
  "New Balance",
  "Skechers",
  "Coca-Cola",
  "Pepsi",
  "Mountain Dew",
  "Gatorade",
  "Red Bull",
  "Nescafé",
  "Starbucks",
  "Lay's",
  "Doritos",
  "Oreo",
  "KitKat",
  "Snickers",
  "M&M's",
  "Pringles",
  "Colgate",
  "Crest",
  "Oral-B",
  "Dove",
  "Axe",
  "Head & Shoulders",
  "Pantene",
  "Gillette",
  "Nivea",
  "Neutrogena",
  "Cetaphil",
  "CeraVe",
  "Tide",
  "Ariel",
  "Persil",
  "Dawn",
] as const

function normalizeName(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[''\u2019`]/g, "'")
}

const CANONICAL = new Set(INCUMBENT_BRANDS.map(n => normalizeName(n)))

async function main() {
  const rows = await db.company.findMany({
    select: { id: true, name: true, isTraditionalCompany: true },
  })

  let updated = 0

  for (const row of rows) {
    if (!CANONICAL.has(normalizeName(row.name))) continue
    if (row.isTraditionalCompany) continue
    await db.company.update({
      where: { id: row.id },
      data: { isTraditionalCompany: true },
    })
    updated += 1
    console.log(`Marked traditional: ${row.name}`)
  }

  console.log(`Done. Updated ${updated} companies.`)
}

main()
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
