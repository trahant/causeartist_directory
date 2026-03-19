import { db } from "~/services/db"

const certifications = [
  {
    name: "B Corp",
    slug: "b-corp",
    description:
      "Certified B Corporations meet the highest standards of verified social and environmental performance, public transparency, and legal accountability.",
    website: "https://www.bcorporation.net",
  },
  {
    name: "Fair Trade",
    slug: "fair-trade",
    description:
      "Fair Trade certification ensures products meet social, economic, and environmental standards.",
    website: "https://www.fairtradecertified.org",
  },
  {
    name: "1% for the Planet",
    slug: "one-percent-for-the-planet",
    description: "Members commit to donating 1% of annual sales to environmental causes.",
    website: "https://www.onepercentfortheplanet.org",
  },
  {
    name: "Carbon Neutral",
    slug: "carbon-neutral",
    description: "Company has achieved net zero carbon emissions.",
    website: null,
  },
  {
    name: "GOTS Certified",
    slug: "gots-certified",
    description: "Global Organic Textile Standard certification for organic fibers.",
    website: "https://global-standard.org",
  },
  {
    name: "Rainforest Alliance",
    slug: "rainforest-alliance",
    description:
      "Rainforest Alliance certification promotes sustainability in agriculture and forestry.",
    website: "https://www.rainforest-alliance.org",
  },
  {
    name: "USDA Organic",
    slug: "usda-organic",
    description: "USDA certified organic products meet strict federal guidelines.",
    website: "https://www.usda.gov/organic",
  },
  {
    name: "Energy Star",
    slug: "energy-star",
    description: "EPA certification for energy efficient products and buildings.",
    website: "https://www.energystar.gov",
  },
  {
    name: "Leaping Bunny",
    slug: "leaping-bunny",
    description: "Cruelty-free certification for cosmetics and personal care products.",
    website: "https://www.leapingbunny.org",
  },
  {
    name: "Climate Neutral",
    slug: "climate-neutral",
    description:
      "Brands that have measured, offset, and reduced their carbon emissions.",
    website: "https://www.climateneutral.org",
  },
  {
    name: "FSC Certified",
    slug: "fsc-certified",
    description:
      "Forest Stewardship Council certification for responsibly sourced wood and paper.",
    website: "https://fsc.org",
  },
  {
    name: "Cradle to Cradle",
    slug: "cradle-to-cradle",
    description:
      "Products designed for safe, circular use across biological and technical cycles.",
    website: "https://www.c2ccertified.org",
  },
  {
    name: "Certified Organic",
    slug: "certified-organic",
    description:
      "Products grown and processed without synthetic pesticides or fertilizers.",
    website: null,
  },
  {
    name: "Benefit Corporation",
    slug: "benefit-corporation",
    description:
      "Legal business structure that considers social and environmental impact alongside profit.",
    website: null,
  },
  {
    name: "Living Wage Certified",
    slug: "living-wage-certified",
    description: "Employer certified to pay all employees a real living wage.",
    website: "https://www.livingwage.org.uk",
  },
] as const

async function main() {
  let total = 0

  for (const cert of certifications) {
    await db.certification.upsert({
      where: { slug: cert.slug },
      update: {
        name: cert.name,
        description: cert.description,
        website: cert.website,
      },
      create: {
        name: cert.name,
        slug: cert.slug,
        description: cert.description,
        website: cert.website,
      },
    })

    total++
    console.log(`Seeded: ${cert.name}`)
  }

  console.log(`Total seeded: ${total}`)
}

main()
  .catch(e => {
    console.error("Error:", e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })

