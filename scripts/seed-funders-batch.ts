import { db } from "~/services/db"

function slugFromName(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

const foundations = [
  "Ford Foundation",
  "Rockefeller Foundation",
  "MacArthur Foundation",
  "Omidyar Network",
  "Skoll Foundation",
  "Luminate",
  "Hewlett Foundation",
  "Knight Foundation",
  "Robert Wood Johnson Foundation",
  "Kresge Foundation",
  "Bloomberg Philanthropies",
  "Schmidt Futures",
  "Wellspring Philanthropic Fund",
  "Draper Richards Kaplan Foundation",
  "Acumen Fund",
  "Echoing Green",
  "Ashoka",
  "Schwab Foundation",
  "Barr Foundation",
  "Packard Foundation",
  "Mott Foundation",
  "Oak Foundation",
  "Blue Meridian Partners",
  "Ceniarth",
  "Prudential Foundation",
]

const corporateFunders = [
  "Google.org",
  "Salesforce.org",
  "Microsoft Philanthropies",
  "Walmart Foundation",
  "JPMorgan Chase Foundation",
  "Bank of America Charitable Foundation",
  "Wells Fargo Foundation",
  "Citi Foundation",
  "Goldman Sachs Gives",
  "BlackRock Foundation",
  "Mastercard Center for Inclusive Growth",
  "Visa Foundation",
  "PayPal Gives",
  "Patagonia Environmental Grants",
  "IKEA Foundation",
  "Target Foundation",
  "Starbucks Foundation",
  "Nike Foundation / Girl Effect",
  "Hewlett Packard Enterprise Foundation",
  "Intel Foundation",
  "Cisco Foundation",
  "SAP SE Corporate Social Responsibility",
  "Accenture Foundation",
  "Deloitte Foundation",
  "PwC Charitable Foundation",
  "KPMG Foundation",
  "EY Foundation",
  "Charles Schwab Foundation",
  "Fidelity Charitable",
  "Vanguard Charitable",
  "Schwab Charitable",
  "AmazonSmile Foundation",
  "Meta Social Impact",
  "Twitter / X Foundation",
  "Airbnb.org",
  "Lyft Foundation",
  "Uber Foundation",
  "Stripe Foundation",
  "Shopify Fund",
  "Square / Block",
  "LinkedIn Economic Graph",
  "Atlassian Foundation",
  "HubSpot for Good",
  "Zoom Foundation",
  "DocuSign Foundation",
  "ServiceNow Foundation",
  "Workday Foundation",
  "Salesforce Ventures Impact Fund",
  "Twilio.org",
  "Zendesk Neighbor Foundation",
  "Snowflake Ventures / Impact",
]

type ErrorEntry = {
  batch: "foundation" | "corporate"
  name: string
  slug: string
  error: unknown
}

function formatErrorShort(e: unknown) {
  if (e instanceof Error) return e.message
  if (typeof e === "string") return e
  try {
    return JSON.stringify(e)
  } catch {
    return String(e)
  }
}

async function upsertDraftFunder({
  name,
  type,
}: {
  name: string
  type: "foundation" | "corporate"
}): Promise<"created" | "skipped"> {
  const slug = slugFromName(name)

  const existing = await db.funder.findUnique({
    where: { slug },
    select: { id: true },
  })

  await db.funder.upsert({
    where: { slug },
    update: {},
    create: {
      name,
      slug,
      status: "draft",
      type,
    },
  })

  return existing ? "skipped" : "created"
}

async function main() {
  let foundationsCreated = 0
  let foundationsSkipped = 0
  let corporateCreated = 0
  let corporateSkipped = 0
  const errors: ErrorEntry[] = []

  for (const name of foundations) {
    const slug = slugFromName(name)
    try {
      const result = await upsertDraftFunder({ name, type: "foundation" })
      if (result === "created") foundationsCreated++
      else foundationsSkipped++
    } catch (e) {
      errors.push({ batch: "foundation", name, slug, error: e })
      console.error(`Failed to upsert foundation: ${name} (${slug})`)
      console.error(formatErrorShort(e))
    }
  }

  for (const name of corporateFunders) {
    const slug = slugFromName(name)
    try {
      const result = await upsertDraftFunder({ name, type: "corporate" })
      if (result === "created") corporateCreated++
      else corporateSkipped++
    } catch (e) {
      errors.push({ batch: "corporate", name, slug, error: e })
      console.error(`Failed to upsert corporate funder: ${name} (${slug})`)
      console.error(formatErrorShort(e))
    }
  }

  const totalCreated = foundationsCreated + corporateCreated

  console.log("\n--- Summary ---")
  console.log("Foundations created:", foundationsCreated)
  console.log("Foundations skipped (already existed):", foundationsSkipped)
  console.log("Corporate funders created:", corporateCreated)
  console.log("Corporate funders skipped (already existed):", corporateSkipped)
  console.log("Total created:", totalCreated)
  console.log("Errors:", errors.length)

  if (errors.length > 0) {
    console.log("\n--- Errors (details) ---")
    for (const err of errors) {
      console.log(`[${err.batch}] ${err.name} (${err.slug})`)
    }
  }
}

main()
  .catch(e => {
    console.error("Error:", e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })

