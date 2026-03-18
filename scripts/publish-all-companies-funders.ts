#!/usr/bin/env node
import { db } from "~/services/db"

async function main() {
  let companyUpdated = 0
  let funderUpdated = 0
  const targetStatus = "published"

  try {
    const companyResult = await db.company.updateMany({
      where: {},
      data: { status: targetStatus },
    })
    companyUpdated = companyResult.count
    console.log(`Companies updated: ${companyUpdated}`)
  } catch (e) {
    console.error("Failed to update companies:", e)
  }

  try {
    const funderResult = await db.funder.updateMany({
      where: {},
      data: { status: targetStatus },
    })
    funderUpdated = funderResult.count
    console.log(`Funders updated: ${funderUpdated}`)
  } catch (e) {
    console.error("Failed to update funders:", e)
  }

  console.log("\n--- Totals ---")
  console.log("Companies updated:", companyUpdated)
  console.log("Funders updated:", funderUpdated)
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})

