#!/usr/bin/env node
import { db } from "~/services/db"

const glossarySlugs = [
  "adaptive-reuse-definition-and-examples",
  "agroforestry",
  "what-is-agroecology",
  "aquaculture-definition-types-and-why-it-matters",
  "b-corp-certification-what-is-it",
  "benefit-corporations-vs-b-corps",
  "biochar-explained",
  "biodiversity",
  "what-are-bioplastics",
  "what-is-blended-finance",
  "what-is-the-blue-economy",
  "blue-economy-explained",
  "buy-one-give-one-pros-and-cons",
  "carbon-border-adjustment-mechanism-cbam",
  "what-is-a-carbon-credit",
  "carbon-emissions",
  "carbon-footprint",
  "carbon-insetting",
  "what-is-carbon-neutrality",
  "carbon-offset-what-it-is-how-it-works-and-why-it-matters",
  "what-is-carbon-sequestration",
  "circular-economy",
  "climate-intelligence",
  "coastal-erosion-causes-effects-and-solutions",
  "what-is-conscious-consumerism",
  "corporate-sustainability-reporting-directive-csrd",
  "cradle-to-cradle-design-definition-and-examples",
  "what-is-decarbonization",
  "direct-air-capture-meaning-benefits-and-challenges",
  "direct-ocean-capture-explained-benefits-and-challenges",
  "what-are-distributed-energy-systems",
  "what-is-donor-advised-fund",
  "what-is-deforestation",
  "what-does-eco-friendly-mean",
  "ecological-footprint",
  "what-is-ecological-restoration",
  "ecosystem-services",
  "emissions-trading-definition-benefits-and-challenges",
  "esg",
  "ewg-verified-what-it-means",
  "what-is-fair-trade-coffee",
  "what-is-fast-fashion",
  "what-is-green-hydrogen",
  "greenwashing",
  "what-is-a-green-bond",
  "hydropower-a-comprehensive-guide-to-renewable-energy-from-water",
  "impact-investing-statistics",
  "in-kind-donations",
  "life-cycle-assessment",
  "long-duration-energy-storage",
  "what-is-microfinance-2",
  "microplastics-definition-examples",
  "monitoring-reporting-verification-mrv",
  "nature-based-solutions",
  "non-financial-reporting-directive-nfrd",
  "what-is-natural-capital",
  "plant-based-materials",
  "what-is-regenerative-agriculture",
  "what-are-renewable-materials",
  "what-is-recycled-plastic-rpet",
  "scope-1-carbon-emissions",
  "scope-2-carbon-emissions",
  "understanding-scope-3-carbon-emissions",
  "what-is-slow-fashion",
  "socially-responsible-investing",
  "what-is-social-entrepreneurship",
  "soil-conservation",
  "supply-chain-traceability",
  "sustainable-economy",
  "what-is-sustainable-fashion",
  "what-is-sustainable-forestry",
  "what-is-a-sustainable-lifestyle",
  "synthetic-materials",
  "triple-bottom-line-business-model",
  "what-does-upcycled-mean",
  "what-is-vegan-leather",
  "venture-philanthropy-101",
  "vertical-farming",
  "water-conservation",
  "what-is-waste-to-energy-definition",
  "zero-waste-meaning-examples",
  "catalytic-capital",
  "cdfis-impact-investment",
  "carbon-removal",
]

async function main() {
  let movedCount = 0
  let alreadyCount = 0
  let notFoundCount = 0
  let errorCount = 0

  for (const slug of glossarySlugs) {
    try {
      const blogPost = await db.blogPost.findUnique({ where: { slug } })

      if (blogPost) {
        await db.glossaryTerm.upsert({
          where: { slug: blogPost.slug },
          create: {
            term: blogPost.title,
            slug: blogPost.slug,
            status: "draft",
            definition: blogPost.content,
            extendedContent: null,
            seoTitle: blogPost.seoTitle,
            seoDescription: blogPost.seoDescription,
          },
          update: {
            term: blogPost.title,
            status: "draft",
            definition: blogPost.content,
            extendedContent: null,
            seoTitle: blogPost.seoTitle,
            seoDescription: blogPost.seoDescription,
          },
        })

        await db.blogPost.delete({ where: { slug: blogPost.slug } })

        movedCount++
        console.log(`Moved: ${slug}`)
        continue
      }

      console.log(`Not found in BlogPost: ${slug}`)
      notFoundCount++

      const existing = await db.glossaryTerm.findUnique({ where: { slug } })
      if (existing) {
        alreadyCount++
        console.log(`Already exists in GlossaryTerm: ${slug}`)
      }
    } catch (e) {
      errorCount++
      console.error(`Error processing ${slug}:`, e)
    }
  }

  console.log("\n--- Summary ---")
  console.log("Moved count:", movedCount)
  console.log("Already in GlossaryTerm count:", alreadyCount)
  console.log("Not found count:", notFoundCount)
  console.log("Error count:", errorCount)
}

main().then(
  () => process.exit(0),
  e => {
    console.error(e)
    process.exit(1)
  },
)
