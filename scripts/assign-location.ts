#!/usr/bin/env bun
/**
 * Manually assign a Location to a company or funder by name (contains match).
 *
 * bun scripts/assign-location.ts --type company --name "Patagonia" --country "United States" --countryCode "US" --city "Ventura"
 * bun scripts/assign-location.ts --type funder --name "Acumen Fund" --country "United States" --countryCode "US" --city "New York"
 */
import * as readline from "node:readline/promises"
import { stdin as input, stdout as output } from "node:process"

import { db } from "~/services/db"

const VALID_REGIONS = [
  "north-america",
  "europe",
  "asia-pacific",
  "latin-america",
  "africa",
  "middle-east",
] as const

const COUNTRY_TO_REGION: Record<string, string> = {
  US: "north-america",
  CA: "north-america",
  MX: "north-america",
  GB: "europe",
  DE: "europe",
  FR: "europe",
  NL: "europe",
  SE: "europe",
  NO: "europe",
  DK: "europe",
  FI: "europe",
  CH: "europe",
  AT: "europe",
  BE: "europe",
  ES: "europe",
  IT: "europe",
  PT: "europe",
  IE: "europe",
  AU: "asia-pacific",
  NZ: "asia-pacific",
  JP: "asia-pacific",
  KR: "asia-pacific",
  SG: "asia-pacific",
  IN: "asia-pacific",
  CN: "asia-pacific",
  ID: "asia-pacific",
  PH: "asia-pacific",
  BR: "latin-america",
  AR: "latin-america",
  CO: "latin-america",
  CL: "latin-america",
  PE: "latin-america",
  KE: "africa",
  NG: "africa",
  GH: "africa",
  ZA: "africa",
  ET: "africa",
  RW: "africa",
  UG: "africa",
  TZ: "africa",
  IL: "middle-east",
  AE: "middle-east",
  SA: "middle-east",
  JO: "middle-east",
}

function parseArgs(argv: string[]): Record<string, string> {
  const out: Record<string, string> = {}
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!
    if (!a.startsWith("--")) continue
    const key = a.slice(2)
    const next = argv[i + 1]
    if (next != null && !next.startsWith("--")) {
      out[key] = next
      i++
    } else {
      out[key] = "true"
    }
  }
  return out
}

function countrySlug(country: string): string {
  const s = country
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
  return s || "unknown"
}

function resolveRegion(countryCode: string): string {
  const mapped = COUNTRY_TO_REGION[countryCode.toUpperCase()]
  if (mapped && (VALID_REGIONS as readonly string[]).includes(mapped)) {
    return mapped
  }
  return "north-america"
}

function printUsage() {
  console.error(`Usage:
  bun scripts/assign-location.ts --type company --name "Patagonia" --country "United States" --countryCode "US" [--city "Ventura"] [--region north-america]
  bun scripts/assign-location.ts --type funder --name "Acumen Fund" --country "United States" --countryCode "US" [--city "New York"] [--region europe]

  --type:        company | funder (required)
  --name:        search string, case-insensitive contains (required)
  --country:     full country name (required)
  --countryCode: ISO 3166-1 alpha-2 (required)
  --city:        optional
  --region:      optional; one of: ${VALID_REGIONS.join(", ")}. If omitted, derived from countryCode.`)
}

type EntityPick = { id: string; name: string }

async function pickEntity(matches: EntityPick[], kind: "company" | "funder"): Promise<EntityPick> {
  if (matches.length === 0) {
    console.error(`No ${kind} found matching --name.`)
    process.exit(1)
  }
  if (matches.length === 1) {
    return matches[0]!
  }

  console.log(`Multiple ${kind} matches for --name:`)
  matches.forEach((m, i) => {
    console.log(`  ${i + 1}. ${m.name}`)
  })

  if (!input.isTTY) {
    console.error("Multiple matches and stdin is not a TTY; narrow --name or run interactively.")
    process.exit(1)
  }

  const rl = readline.createInterface({ input, output })
  try {
    const ans = (await rl.question(`Enter number (1–${matches.length}): `)).trim()
    const n = Number.parseInt(ans, 10)
    if (Number.isNaN(n) || n < 1 || n > matches.length) {
      console.error("Invalid selection.")
      process.exit(1)
    }
    return matches[n - 1]!
  } finally {
    rl.close()
  }
}

async function main() {
  const raw = parseArgs(process.argv.slice(2))

  const typeRaw = raw.type?.toLowerCase()
  const name = raw.name?.trim()
  const country = raw.country?.trim()
  const countryCodeIn = raw.countryCode?.trim()
  const cityRaw = raw.city?.trim()
  const regionRaw = raw.region?.trim()

  if (!typeRaw || (typeRaw !== "company" && typeRaw !== "funder")) {
    console.error("Missing or invalid --type (use company or funder).")
    printUsage()
    process.exit(1)
  }
  if (!name) {
    console.error("Missing --name.")
    printUsage()
    process.exit(1)
  }
  if (!country) {
    console.error("Missing --country.")
    printUsage()
    process.exit(1)
  }
  if (!countryCodeIn) {
    console.error("Missing --countryCode.")
    printUsage()
    process.exit(1)
  }

  const countryCode = countryCodeIn.toUpperCase()
  if (countryCode.length !== 2 || !/^[A-Z]{2}$/.test(countryCode)) {
    console.error("--countryCode must be a 2-letter ISO code.")
    process.exit(1)
  }

  let region: string
  if (regionRaw) {
    if (!(VALID_REGIONS as readonly string[]).includes(regionRaw)) {
      console.error(
        `--region must be one of: ${VALID_REGIONS.join(", ")}`,
      )
      process.exit(1)
    }
    region = regionRaw
  } else {
    region = resolveRegion(countryCode)
  }

  const city = cityRaw && cityRaw.length > 0 ? cityRaw : undefined

  const slug = countrySlug(country)

  const location = await db.location.upsert({
    where: { slug },
    update: {
      country,
      countryCode,
      region,
    },
    create: {
      name: country,
      slug,
      country,
      countryCode,
      region,
    },
    select: { id: true },
  })

  const locationId = location.id

  let entity: EntityPick
  if (typeRaw === "company") {
    const matches = await db.company.findMany({
      where: { name: { contains: name, mode: "insensitive" } },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    })
    entity = await pickEntity(matches, "company")

    await db.companyLocation.upsert({
      where: {
        companyId_locationId: {
          companyId: entity.id,
          locationId,
        },
      },
      update: {},
      create: {
        companyId: entity.id,
        locationId,
      },
    })
  } else {
    const matches = await db.funder.findMany({
      where: { name: { contains: name, mode: "insensitive" } },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    })
    entity = await pickEntity(matches, "funder")

    await db.funderLocation.upsert({
      where: {
        funderId_locationId: {
          funderId: entity.id,
          locationId,
        },
      },
      update: {},
      create: {
        funderId: entity.id,
        locationId,
      },
    })
  }

  const place = city != null && city !== "" ? `${city}, ${country}` : country
  console.log(`Assigned ${place} to ${entity.name}`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
