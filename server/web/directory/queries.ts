import { cacheLife, cacheTag } from "next/cache"
import type { Prisma } from "~/.generated/prisma/client"
import {
  companyManyPayload,
  type CompanyMany,
} from "~/server/web/companies/payloads"
import type { DirectoryFilterParams } from "~/server/web/directory/schema"
import type { DirectorySectorFacet } from "~/server/web/directory/types"
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

function listOrderBy(sort: DirectoryFilterParams["sort"]): Prisma.CompanyOrderByWithRelationInput {
  if (sort === "name.desc") return { name: "desc" }
  if (sort === "newest") return { createdAt: "desc" }
  return { name: "asc" }
}

function funderListOrderBy(sort: DirectoryFilterParams["sort"]): Prisma.FunderOrderByWithRelationInput {
  if (sort === "name.desc") return { name: "desc" }
  if (sort === "newest") return { createdAt: "desc" }
  return { name: "asc" }
}

function compareDirectoryItems(
  a: DirectoryListItem,
  b: DirectoryListItem,
  sort: DirectoryFilterParams["sort"],
): number {
  if (sort === "newest") {
    return b.item.createdAt.getTime() - a.item.createdAt.getTime()
  }
  if (sort === "name.desc") {
    return b.item.name.localeCompare(a.item.name, undefined, { sensitivity: "base" })
  }
  return a.item.name.localeCompare(b.item.name, undefined, { sensitivity: "base" })
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

  const { q, kind, sector, sort, page, perPage } = params
  const sectorSlug = sector?.trim() || undefined
  const skip = (page - 1) * perPage

  const cWhere = companyWhere(sectorSlug, q)
  const fWhere = funderWhere(sectorSlug, q)

  if (kind === "companies") {
    const cOrder = listOrderBy(sort)
    const [items, total] = await Promise.all([
      db.company.findMany({
        where: cWhere,
        select: companyManyPayload,
        orderBy: cOrder,
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
    const fOrder = funderListOrderBy(sort)
    const [items, total] = await Promise.all([
      db.funder.findMany({
        where: fWhere,
        select: funderManyPayload,
        orderBy: fOrder,
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
    }),
    db.funder.findMany({
      where: fWhere,
      select: funderManyPayload,
    }),
  ])

  const merged: DirectoryListItem[] = [
    ...companies.map(item => ({ type: "company" as const, item })),
    ...funders.map(item => ({ type: "funder" as const, item })),
  ].sort((a, b) => compareDirectoryItems(a, b, sort))

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

export async function findDirectorySectorCounts(): Promise<DirectorySectorFacet[]> {
  "use cache"

  cacheTag("directory-facets")
  cacheLife("directoryStats")

  const [sectors, companyBySector, funderBySector] = await Promise.all([
    db.sector.findMany({
      select: { id: true, slug: true, name: true },
      orderBy: { name: "asc" },
    }),
    db.companySector.groupBy({
      by: ["sectorId"],
      where: { company: { status: "published" } },
      _count: { _all: true },
    }),
    db.funderSector.groupBy({
      by: ["sectorId"],
      where: { funder: { status: "published" } },
      _count: { _all: true },
    }),
  ])

  const companyMap = new Map(companyBySector.map(r => [r.sectorId, r._count._all]))
  const funderMap = new Map(funderBySector.map(r => [r.sectorId, r._count._all]))

  return sectors.map(s => ({
    slug: s.slug,
    name: s.name,
    count: (companyMap.get(s.id) ?? 0) + (funderMap.get(s.id) ?? 0),
  }))
}
