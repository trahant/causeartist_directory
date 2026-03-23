import { cacheLife, cacheTag } from "next/cache"
import type { Prisma } from "~/.generated/prisma/client"
import {
  companyManyPayload,
  type CompanyMany,
} from "~/server/web/companies/payloads"
import type { DirectoryFilterParams } from "~/server/web/directory/schema"
import type { DirectoryLocationFacet, DirectorySectorFacet } from "~/server/web/directory/types"
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
  locationSlug: string | undefined,
  q: string | undefined,
): Prisma.CompanyWhereInput {
  const sectorFilter: Prisma.CompanyWhereInput =
    sectorSlug && sectorSlug.length > 0
      ? { sectors: { some: { sector: { slug: sectorSlug } } } }
      : {}

  const locationFilter: Prisma.CompanyWhereInput =
    locationSlug && locationSlug.length > 0
      ? { locations: { some: { location: { slug: locationSlug } } } }
      : {}

  const textOr = buildTextFilter(q)

  return {
    status: "published",
    ...sectorFilter,
    ...locationFilter,
    ...(textOr ? { OR: textOr } : {}),
  }
}

function funderWhere(
  sectorSlug: string | undefined,
  locationSlug: string | undefined,
  q: string | undefined,
): Prisma.FunderWhereInput {
  const sectorFilter: Prisma.FunderWhereInput =
    sectorSlug && sectorSlug.length > 0
      ? { sectors: { some: { sector: { slug: sectorSlug } } } }
      : {}

  const locationFilter: Prisma.FunderWhereInput =
    locationSlug && locationSlug.length > 0
      ? { locations: { some: { location: { slug: locationSlug } } } }
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
    ...locationFilter,
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

  const { q, kind, sector, location, sort, page, perPage } = params
  const sectorSlug = sector?.trim() || undefined
  const locationSlug = location?.trim() || undefined
  const skip = (page - 1) * perPage

  const cWhere = companyWhere(sectorSlug, locationSlug, q)
  const fWhere = funderWhere(sectorSlug, locationSlug, q)

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

export async function findDirectoryLocationCounts(): Promise<DirectoryLocationFacet[]> {
  "use cache"

  cacheTag("directory-facets")
  cacheLife("directoryStats")

  const [locations, companyByLoc, funderByLoc] = await Promise.all([
    db.location.findMany({
      select: { id: true, slug: true, name: true, countryCode: true },
      orderBy: { name: "asc" },
    }),
    db.companyLocation.groupBy({
      by: ["locationId"],
      where: { company: { status: "published" } },
      _count: { _all: true },
    }),
    db.funderLocation.groupBy({
      by: ["locationId"],
      where: { funder: { status: "published" } },
      _count: { _all: true },
    }),
  ])

  const companyMap = new Map(companyByLoc.map(r => [r.locationId, r._count._all]))
  const funderMap = new Map(funderByLoc.map(r => [r.locationId, r._count._all]))

  return locations
    .map(l => ({
      slug: l.slug,
      name: l.name,
      countryCode: l.countryCode,
      count: (companyMap.get(l.id) ?? 0) + (funderMap.get(l.id) ?? 0),
    }))
    .filter(f => f.count > 0)
}
