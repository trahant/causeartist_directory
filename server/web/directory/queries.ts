import { cacheLife, cacheTag } from "next/cache"
import type { Prisma } from "~/.generated/prisma/client"
import {
  companyManyPayload,
  type CompanyMany,
} from "~/server/web/companies/payloads"
import type { DirectoryFilterParams } from "~/server/web/directory/schema"
import type { DirectoryLocationFacet, DirectorySectorFacet } from "~/server/web/directory/types"
import { activeSectorsWhere } from "~/server/web/sectors/retired"
import { companyDirectoryWhere, funderDirectoryWhere } from "~/server/web/directory/where"
import { funderManyPayload, type FunderMany } from "~/server/web/funders/payloads"
import { db } from "~/services/db"

export type DirectoryListItem =
  | { type: "company"; item: CompanyMany }
  | { type: "funder"; item: FunderMany }

export type DirectoryKind = "companies" | "funders"

/** Shared shape for `/companies` and `/funders` listing URLs (no `kind`). */
export type EntityDirectoryListParams = Pick<
  DirectoryFilterParams,
  "q" | "sector" | "location" | "sort" | "page" | "perPage"
>

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

  const cWhere = companyDirectoryWhere(sectorSlug, locationSlug, q)
  const fWhere = funderDirectoryWhere(sectorSlug, locationSlug, q)

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

export async function searchCompanyDirectory(params: EntityDirectoryListParams): Promise<{
  items: DirectoryListItem[]
  total: number
  page: number
  perPage: number
}> {
  "use cache"

  cacheTag("directory", "companies")
  cacheLife("infinite")

  const { q, sector, location, sort, page, perPage } = params
  const sectorSlug = sector?.trim() || undefined
  const locationSlug = location?.trim() || undefined
  const skip = (page - 1) * perPage
  const where = companyDirectoryWhere(sectorSlug, locationSlug, q)
  const orderBy = listOrderBy(sort)

  const [items, total] = await Promise.all([
    db.company.findMany({
      where,
      select: companyManyPayload,
      orderBy,
      skip,
      take: perPage,
    }),
    db.company.count({ where }),
  ])

  return {
    items: items.map(item => ({ type: "company" as const, item })),
    total,
    page,
    perPage,
  }
}

export async function searchFunderDirectory(params: EntityDirectoryListParams): Promise<{
  items: DirectoryListItem[]
  total: number
  page: number
  perPage: number
}> {
  "use cache"

  cacheTag("directory", "funders")
  cacheLife("infinite")

  const { q, sector, location, sort, page, perPage } = params
  const sectorSlug = sector?.trim() || undefined
  const locationSlug = location?.trim() || undefined
  const skip = (page - 1) * perPage
  const where = funderDirectoryWhere(sectorSlug, locationSlug, q)
  const orderBy = funderListOrderBy(sort)

  const [items, total] = await Promise.all([
    db.funder.findMany({
      where,
      select: funderManyPayload,
      orderBy,
      skip,
      take: perPage,
    }),
    db.funder.count({ where }),
  ])

  return {
    items: items.map(item => ({ type: "funder" as const, item })),
    total,
    page,
    perPage,
  }
}

export async function findDirectorySectors() {
  "use cache"

  cacheTag("directory-sectors")
  cacheLife("infinite")

  return db.sector.findMany({
    where: activeSectorsWhere(),
    select: { name: true, slug: true },
    orderBy: { name: "asc" },
  })
}

export async function findDirectorySectorCounts(kind: DirectoryKind): Promise<DirectorySectorFacet[]> {
  "use cache"

  cacheTag("directory-facets")
  cacheLife("directoryStats")

  const [sectors, companyBySector, funderBySector] = await Promise.all([
    db.sector.findMany({
      where: activeSectorsWhere(),
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
    count:
      kind === "companies"
        ? (companyMap.get(s.id) ?? 0)
        : (funderMap.get(s.id) ?? 0),
  }))
}

export async function findDirectoryLocationCounts(kind: DirectoryKind): Promise<DirectoryLocationFacet[]> {
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
      count:
        kind === "companies"
          ? (companyMap.get(l.id) ?? 0)
          : (funderMap.get(l.id) ?? 0),
    }))
    .filter(f => f.count > 0)
}
