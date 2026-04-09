#!/usr/bin/env bun
import { readFile, mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { slugify } from "@primoui/utils"
import { db } from "~/services/db"

type Row = {
  target: string
  category: "fashion" | "beverage" | "food" | "personal-care" | "household"
  alternatives: string[]
}

type ImportStats = {
  createdTargets: string[]
  updatedTargets: string[]
  createdAlternatives: string[]
  updatedAlternatives: string[]
  linksCreated: number
  linksSkippedExisting: number
  skippedSelfLinks: number
}

function summaryFor(target: string, category: Row["category"]) {
  const labels: Record<Row["category"], string> = {
    fashion: "fashion and footwear",
    beverage: "beverages",
    food: "food and snacks",
    "personal-care": "personal care",
    household: "household products",
  }
  return `Curated responsible alternatives to ${target} across ${labels[category]}.`
}

async function upsertCompany(
  name: string,
  role: "Target" | "Alternative" | "Both",
  isTraditionalCompany: boolean,
) {
  const baseSlug = slugify(name)
  const existingBySlug = await db.company.findUnique({
    where: { slug: baseSlug },
    select: { id: true, slug: true },
  })
  const existingByName = await db.company.findFirst({
    where: { name: { equals: name, mode: "insensitive" } },
    select: { id: true, slug: true, alternativeRole: true },
  })

  const existing = existingBySlug ?? existingByName
  if (existing) {
    await db.company.update({
      where: { id: existing.id },
      data: {
        name,
        status: "draft",
        alternativeRole: role,
        isTraditionalCompany,
      },
    })
    return { id: existing.id, created: false }
  }

  let slug = baseSlug
  let i = 2
  while (await db.company.findUnique({ where: { slug }, select: { id: true } })) {
    slug = `${baseSlug}-${i}`
    i += 1
  }

  const created = await db.company.create({
    data: {
      name,
      slug,
      status: "draft",
      alternativeRole: role,
      isTraditionalCompany,
    },
    select: { id: true },
  })
  return { id: created.id, created: true }
}

async function main() {
  const dataPath = path.join(process.cwd(), "scripts", "data", "brand-alternatives-50.json")
  const raw = await readFile(dataPath, "utf8")
  const rows = JSON.parse(raw) as Row[]
  const targetSet = new Set(rows.map(r => r.target))
  const appearsAsAlternative = new Set(rows.flatMap(r => r.alternatives))

  const desiredRoleByName = new Map<string, "Target" | "Alternative" | "Both">()
  for (const name of new Set([...targetSet, ...appearsAsAlternative])) {
    const isTarget = targetSet.has(name)
    const isAlternative = appearsAsAlternative.has(name)
    if (isTarget && isAlternative) desiredRoleByName.set(name, "Both")
    else if (isTarget) desiredRoleByName.set(name, "Target")
    else desiredRoleByName.set(name, "Alternative")
  }

  const stats: ImportStats = {
    createdTargets: [],
    updatedTargets: [],
    createdAlternatives: [],
    updatedAlternatives: [],
    linksCreated: 0,
    linksSkippedExisting: 0,
    skippedSelfLinks: 0,
  }

  for (const row of rows) {
    const target = await upsertCompany(
      row.target,
      desiredRoleByName.get(row.target) ?? "Target",
      targetSet.has(row.target),
    )
    if (target.created) stats.createdTargets.push(row.target)
    else stats.updatedTargets.push(row.target)

    await db.company.update({
      where: { id: target.id },
      data: { alternativesSummary: summaryFor(row.target, row.category) },
    })

    for (let index = 0; index < row.alternatives.length; index++) {
      const altName = row.alternatives[index]!
      const alternative = await upsertCompany(
        altName,
        desiredRoleByName.get(altName) ?? "Alternative",
        targetSet.has(altName),
      )
      if (alternative.created) stats.createdAlternatives.push(altName)
      else stats.updatedAlternatives.push(altName)

      if (alternative.id === target.id) {
        stats.skippedSelfLinks += 1
        continue
      }

      const existingLink = await db.companyAlternative.findUnique({
        where: {
          companyId_alternativeCompanyId: {
            companyId: target.id,
            alternativeCompanyId: alternative.id,
          },
        },
        select: { companyId: true },
      })

      if (existingLink) {
        await db.companyAlternative.update({
          where: {
            companyId_alternativeCompanyId: {
              companyId: target.id,
              alternativeCompanyId: alternative.id,
            },
          },
          data: { sortOrder: index },
        })
        stats.linksSkippedExisting += 1
        continue
      }

      await db.companyAlternative.create({
        data: {
          companyId: target.id,
          alternativeCompanyId: alternative.id,
          sortOrder: index,
        },
      })
      stats.linksCreated += 1
    }
  }

  const report = {
    importedAt: new Date().toISOString(),
    targetsTotal: rows.length,
    alternativesUniqueTotal: new Set(rows.flatMap(r => r.alternatives)).size,
    ...stats,
  }

  const reportDir = path.join(process.cwd(), "scripts", "reports")
  await mkdir(reportDir, { recursive: true })
  const reportPath = path.join(reportDir, "brand-alternatives-import-report.json")
  await writeFile(reportPath, JSON.stringify(report, null, 2))

  console.log(`Imported ${rows.length} targets`)
  console.log(`Created target profiles: ${stats.createdTargets.length}`)
  console.log(`Created alternative profiles: ${new Set(stats.createdAlternatives).size}`)
  console.log(`Links created: ${stats.linksCreated}`)
  console.log(`Links already existing (re-ranked): ${stats.linksSkippedExisting}`)
  console.log(`Report written: ${reportPath}`)
}

main()
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
