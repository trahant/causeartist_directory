#!/usr/bin/env node
import { db } from "~/services/db"

const termMap: Record<string, string> = {
  "Adaptive Reuse Definition and Examples": "Adaptive Reuse",
  "Agroforestry": "Agroforestry",
  "What Is Agroecology": "Agroecology",
  "Aquaculture Definition, Types, and Why It Matters": "Aquaculture",
  "B Corp Certification: What Is It": "B Corp Certification",
  "Benefit Corporations vs B Corps": "Benefit Corporations",
  "Biochar Explained": "Biochar",
  "Biodiversity": "Biodiversity",
  "What Are Bioplastics": "Bioplastics",
  "What Is Blended Finance": "Blended Finance",
  "What Is the Blue Economy": "Blue Economy",
  "Blue Economy Explained": "Blue Economy",
  "Buy-One-Give-One: Pros and Cons": "Buy One Give One",
  "Carbon Border Adjustment Mechanism (CBAM)": "Carbon Border Adjustment Mechanism",
  "What Is a Carbon Credit": "Carbon Credit",
  "Carbon Emissions": "Carbon Emissions",
  "Carbon Footprint": "Carbon Footprint",
  "Carbon Insetting": "Carbon Insetting",
  "What Is Carbon Neutrality": "Carbon Neutrality",
  "Carbon Offset: What It Is, How It Works, and Why It Matters": "Carbon Offset",
  "What Is Carbon Sequestration": "Carbon Sequestration",
  "Circular Economy": "Circular Economy",
  "Climate Intelligence": "Climate Intelligence",
  "Coastal Erosion: Causes, Effects, and Solutions": "Coastal Erosion",
  "What Is Conscious Consumerism": "Conscious Consumerism",
  "Corporate Sustainability Reporting Directive (CSRD)": "Corporate Sustainability Reporting Directive",
  "Cradle to Cradle Design: Definition and Examples": "Cradle to Cradle Design",
  "What Is Decarbonization": "Decarbonization",
  "Direct Air Capture: Meaning, Benefits, and Challenges": "Direct Air Capture",
  "Direct Ocean Capture Explained: Benefits and Challenges": "Direct Ocean Capture",
  "What Are Distributed Energy Systems": "Distributed Energy Systems",
  "What Is a Donor Advised Fund": "Donor Advised Fund",
  "What Is Deforestation": "Deforestation",
  "What Does Eco-Friendly Mean": "Eco-Friendly",
  "Ecological Footprint": "Ecological Footprint",
  "What Is Ecological Restoration": "Ecological Restoration",
  "Ecosystem Services": "Ecosystem Services",
  "Emissions Trading: Definition, Benefits, and Challenges": "Emissions Trading",
  "ESG": "ESG",
  "EWG Verified: What It Means": "EWG Verified",
  "What Is Fair Trade Coffee": "Fair Trade Coffee",
  "What Is Fast Fashion": "Fast Fashion",
  "What Is Green Hydrogen": "Green Hydrogen",
  "Greenwashing": "Greenwashing",
  "What Is a Green Bond": "Green Bond",
  "Hydropower: A Comprehensive Guide to Renewable Energy from Water": "Hydropower",
  "Impact Investing Statistics": "Impact Investing",
  "In-Kind Donations": "In-Kind Donations",
  "Life Cycle Assessment": "Life Cycle Assessment",
  "Long-Duration Energy Storage": "Long-Duration Energy Storage",
  "What Is Microfinance": "Microfinance",
  "Microplastics: Definition, Examples": "Microplastics",
  "Monitoring, Reporting, and Verification (MRV)": "Monitoring Reporting and Verification",
  "Nature-Based Solutions": "Nature-Based Solutions",
  "Non-Financial Reporting Directive (NFRD)": "Non-Financial Reporting Directive",
  "What Is Natural Capital": "Natural Capital",
  "Plant-Based Materials": "Plant-Based Materials",
  "What Is Regenerative Agriculture": "Regenerative Agriculture",
  "What Are Renewable Materials": "Renewable Materials",
  "What Is Recycled Plastic (rPET)": "Recycled Plastic (rPET)",
  "Scope 1 Carbon Emissions": "Scope 1 Carbon Emissions",
  "Scope 2 Carbon Emissions": "Scope 2 Carbon Emissions",
  "Understanding Scope 3 Carbon Emissions": "Scope 3 Carbon Emissions",
  "What Is Slow Fashion": "Slow Fashion",
  "Socially Responsible Investing": "Socially Responsible Investing",
  "What Is Social Entrepreneurship": "Social Entrepreneurship",
  "Soil Conservation": "Soil Conservation",
  "Supply Chain Traceability": "Supply Chain Transparency",
  "Sustainable Economy": "Sustainable Economy",
  "What Is Sustainable Fashion": "Sustainable Fashion",
  "What Is Sustainable Forestry": "Sustainable Forestry",
  "What Is a Sustainable Lifestyle": "Sustainable Lifestyle",
  "Synthetic Materials": "Synthetic Materials",
  "Triple Bottom Line Business Model": "Triple Bottom Line",
  "What Does Upcycled Mean": "Upcycled",
  "What Is Vegan Leather": "Vegan Leather",
  "Venture Philanthropy 101": "Venture Philanthropy",
  "Vertical Farming": "Vertical Farming",
  "Water Conservation": "Water Conservation",
  "What Is Waste-to-Energy Definition": "Waste-to-Energy",
  "Zero Waste: Meaning, Examples": "Zero Waste",
  "Catalytic Capital": "Catalytic Capital",
  "CDFIs Impact Investment": "CDFIs",
}

const PREFIXES = ["What Is ", "What Are ", "What Does "]

const autoCleanTerm = (term: string): string | null => {
  let next = term.trim()

  for (const prefix of PREFIXES) {
    if (next.toLowerCase().startsWith(prefix.toLowerCase())) {
      next = next.slice(prefix.length).trim()
      break
    }
  }

  if (!next || next === term) return null

  // Strip trailing punctuation commonly used in titles
  next = next.replace(/[.:!?]+$/g, "").trim()

  return next && next !== term ? next : null
}

async function main() {
  let mappedUpdated = 0
  let autoCleaned = 0
  let notFound = 0
  let errorCount = 0

  // 1. Apply explicit term map
  for (const [oldTitle, cleanName] of Object.entries(termMap)) {
    try {
      const existing = await db.glossaryTerm.findFirst({
        where: {
          term: {
            contains: oldTitle,
            mode: "insensitive",
          },
        },
        select: { id: true, term: true },
      })

      if (!existing) {
        notFound++
        console.log(`Not found: ${oldTitle}`)
        continue
      }

      if (existing.term === cleanName) {
        console.log(`Already clean: ${existing.term}`)
        continue
      }

      await db.glossaryTerm.update({
        where: { id: existing.id },
        data: { term: cleanName },
      })

      mappedUpdated++
      console.log(`Updated (map): ${existing.term} → ${cleanName}`)
    } catch (e) {
      errorCount++
      console.error(`Error processing "${oldTitle}":`, e)
    }
  }

  // 2. Auto-clean any remaining "What Is/Are/Does ..." terms not in the map
  try {
    const allTerms = await db.glossaryTerm.findMany({
      select: { id: true, term: true },
    })

    for (const term of allTerms) {
      if (!term.term) continue
      if (termMap[term.term]) continue

      const cleaned = autoCleanTerm(term.term)
      if (!cleaned || cleaned === term.term) continue

      try {
        await db.glossaryTerm.update({
          where: { id: term.id },
          data: { term: cleaned },
        })

        autoCleaned++
        console.log(`Auto-cleaned: ${term.term} → ${cleaned}`)
      } catch (e) {
        errorCount++
        console.error(`Error auto-cleaning "${term.term}":`, e)
      }
    }
  } catch (e) {
    errorCount++
    console.error("Error during auto-clean fetch:", e)
  }

  console.log("\n--- Summary ---")
  console.log("Updated from map count:", mappedUpdated)
  console.log("Auto-cleaned count:", autoCleaned)
  console.log("Not found count:", notFound)
  console.log("Error count:", errorCount)
}

main().then(
  () => process.exit(0),
  e => {
    console.error(e)
    process.exit(1)
  },
)

