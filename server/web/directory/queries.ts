import { cacheLife, cacheTag } from "next/cache"
import type { Prisma } from "~/.generated/prisma/client"
import {
  companyManyPayload,
  type CompanyMany,
} from "~/server/web/companies/payloads"
import type { DirectoryFilterParams } from "~/server/web/directory/schema"
import { funderManyPayload, type FunderMany } from "~/server/web/funders/payloads"
import { db } from "~/services/db"

export type DirectoryListItem =
  | { type: "company"; item: CompanyMany }
  | { type: "funder"; item: FunderMany }

function buildTextFilter(q: string | undefined): Prisma.CompanyWhereInput["OR"] | undefined {
  if (!q?.trim()) return undefined
  const t = q.trim()
  return [
    { name: { contains: t, mode: "insensitive" } },
    { tagline: { contains: t, mode: "insensitive" } },
    { description: { contains: t, mode: "insensitive" } },
  ]
}

function companyWhere(
  sectorSlug: string | undefined,
  q: string | undefined,
): Prisma.CompanyWhereInput {
  const sectorFilter: Prisma.CompanyWhereInput =
    sectorSlug && sectorSlug.length > 0
      ? { sectors: { some: { sector: { slug: sectorSlug } } } }
      : {}

  const textOr = buildTextFilter(q)

  return {
    status: "published",
    ...sectorFilter,
    ...(textOr ? { OR: textOr } : {}),
  }
}

function funderWhere(
  sectorSlug: string | undefined,
  q: string | undefined,
): Prisma.FunderWhereInput {
  const sectorFilter: Prisma.FunderWhereInput =
    sectorSlug && sectorSlug.length > 0
      ? { sectors: { some: { sector: { slug: sectorSlug } } } }
      : {}

  const t = q?.trim()
  const funderOr = t
    ? ([
        { name: { contains: t, mode: "insensitive" } },
        { description: { contains: t, mode: "insensitive" } },
      ] satisfies Prisma.FunderWhereInput[])
    : undefined

  return {
    status: "published",
    ...sectorFilter,
    ...(funderOr ? { OR: funderOr } : {}),
  }
}

export async function searchDirectory(params: DirectoryFilterParams): Promise<{
  items: DirectoryListItem[]
  total: number
  page: number
  perPage: number
}> {
  "use cache"

  cacheTag("directory")
  cacheLife("infinite")

  const { q, kind, sector, page, perPage } = params
  const sectorSlug = sector?.trim() || undefined
  const skip = (page - 1) * perPage

  const cWhere = companyWhere(sectorSlug, q)
  const fWhere = funderWhere(sectorSlug, q)

  if (kind === "companies") {
    const [items, total] = await Promise.all([
      db.company.findMany({
        where: cWhere,
        select: companyManyPayload,
        orderBy: { name: "asc" },
        skip,
        take: perPage,
      }),
      db.company.count({ where: cWhere }),
    ])
    return {
      items: items.map(item => ({ type: "company" as const, item })),
      total,
      page,
      perPage,
    }
  }

  if (kind === "funders") {
    const [items, total] = await Promise.all([
      db.funder.findMany({
        where: fWhere,
        select: funderManyPayload,
        orderBy: { name: "asc" },
        skip,
        take: perPage,
      }),
      db.funder.count({ where: fWhere }),
    ])
    return {
      items: items.map(item => ({ type: "funder" as const, item })),
      total,
      page,
      perPage,
    }
  }

  const [companies, funders] = await Promise.all([
    db.company.findMany({
      where: cWhere,
      select: companyManyPayload,
      orderBy: { name: "asc" },
    }),
    db.funder.findMany({
      where: fWhere,
      select: funderManyPayload,
      orderBy: { name: "asc" },
    }),
  ])

  const merged: DirectoryListItem[] = [
    ...companies.map(item => ({ type: "company" as const, item })),
    ...funders.map(item => ({ type: "funder" as const, item })),
  ].sort((a, b) => a.item.name.localeCompare(b.item.name))

  const total = merged.length
  const items = merged.slice(skip, skip + perPage)

  return { items, total, page, perPage }
}

export async function findDirectorySectors() {
  "use cache"

  cacheTag("directory-sectors")
  cacheLife("infinite")

  return db.sector.findMany({
    select: { name: true, slug: true },
    orderBy: { name: "asc" },
  })
}
