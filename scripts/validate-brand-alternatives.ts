#!/usr/bin/env bun
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { db } from "~/services/db"

type Phase = "phase1" | "phase2" | "phase3" | "phase4"

const phase1FashionTop10 = new Set([
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
])

function getPhase(name: string, category: string): Phase {
  if (phase1FashionTop10.has(name)) return "phase1"
  if (category === "fashion") return "phase2"
  if (category === "beverage" || category === "food") return "phase3"
  return "phase4"
}

async function main() {
  const targets = await db.company.findMany({
    where: { alternativeRole: { in: ["Target", "Both"] } },
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      alternativesSummary: true,
      alternatives: {
        orderBy: { sortOrder: "asc" },
        select: {
          sortOrder: true,
          alternativeCompany: {
            select: { id: true, name: true, slug: true, status: true },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  })

  const categoryByName: Record<string, string> = {
    Nike: "fashion",
    Adidas: "fashion",
    Puma: "fashion",
    Reebok: "fashion",
    "Under Armour": "fashion",
    "H&M": "fashion",
    Zara: "fashion",
    "Old Navy": "fashion",
    Gap: "fashion",
    "Levi's": "fashion",
    Uniqlo: "fashion",
    Shein: "fashion",
    Lululemon: "fashion",
    "The North Face": "fashion",
    Patagonia: "fashion",
    Columbia: "fashion",
    Converse: "fashion",
    Vans: "fashion",
    "New Balance": "fashion",
    Skechers: "fashion",
    "Coca-Cola": "beverage",
    Pepsi: "beverage",
    "Mountain Dew": "beverage",
    Gatorade: "beverage",
    "Red Bull": "beverage",
    "Nescafé": "food",
    Starbucks: "food",
    "Lay's": "food",
    Doritos: "food",
    Oreo: "food",
    KitKat: "food",
    Snickers: "food",
    "M&M's": "food",
    Pringles: "food",
    Colgate: "personal-care",
    Crest: "personal-care",
    "Oral-B": "personal-care",
    Dove: "personal-care",
    Axe: "personal-care",
    "Head & Shoulders": "personal-care",
    Pantene: "personal-care",
    Gillette: "personal-care",
    Nivea: "personal-care",
    Neutrogena: "personal-care",
    Cetaphil: "personal-care",
    CeraVe: "personal-care",
    Tide: "household",
    Ariel: "household",
    Persil: "household",
    Dawn: "household",
  }

  const report = {
    generatedAt: new Date().toISOString(),
    totals: {
      targets: targets.length,
      draftTargets: targets.filter(t => t.status === "draft").length,
      publishedTargets: targets.filter(t => t.status === "published").length,
      targetsWithNoSummary: targets.filter(t => !t.alternativesSummary?.trim()).length,
      targetsWithLessThan5Alternatives: targets.filter(t => t.alternatives.length < 5).length,
    },
    weakMappings: targets
      .filter(t => t.alternatives.length < 5)
      .map(t => ({ name: t.name, slug: t.slug, alternativesCount: t.alternatives.length })),
    brokenAlternativeLinks: targets.flatMap(t =>
      t.status !== "published"
        ? []
        : t.alternatives
            .filter(link => link.alternativeCompany.status !== "published")
            .map(link => ({
              target: t.name,
              alternative: link.alternativeCompany.name,
              alternativeStatus: link.alternativeCompany.status,
            })),
    ),
    editorialQueue: {
      phase1: [] as Array<{ name: string; slug: string; status: string; alternativesCount: number }>,
      phase2: [] as Array<{ name: string; slug: string; status: string; alternativesCount: number }>,
      phase3: [] as Array<{ name: string; slug: string; status: string; alternativesCount: number }>,
      phase4: [] as Array<{ name: string; slug: string; status: string; alternativesCount: number }>,
    },
  }

  for (const target of targets) {
    const category = categoryByName[target.name] ?? "household"
    const phase = getPhase(target.name, category)
    report.editorialQueue[phase].push({
      name: target.name,
      slug: target.slug,
      status: target.status,
      alternativesCount: target.alternatives.length,
    })
  }

  const reportDir = path.join(process.cwd(), "scripts", "reports")
  await mkdir(reportDir, { recursive: true })
  const reportPath = path.join(reportDir, "brand-alternatives-validation-report.json")
  await writeFile(reportPath, JSON.stringify(report, null, 2))

  console.log(`Targets: ${report.totals.targets}`)
  console.log(`Draft targets: ${report.totals.draftTargets}`)
  console.log(`Published targets: ${report.totals.publishedTargets}`)
  console.log(`Targets with <5 alternatives: ${report.totals.targetsWithLessThan5Alternatives}`)
  console.log(`Validation report written: ${reportPath}`)
}

main()
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
