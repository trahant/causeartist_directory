import type { Prisma } from "~/.generated/prisma/client"

export function buildCompanyTextFilter(q: string | undefined): Prisma.CompanyWhereInput["OR"] | undefined {
  if (!q?.trim()) return undefined
  const t = q.trim()
  return [
    { name: { contains: t, mode: "insensitive" } },
    { tagline: { contains: t, mode: "insensitive" } },
    { description: { contains: t, mode: "insensitive" } },
  ]
}

export function companyDirectoryWhere(
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

  const textOr = buildCompanyTextFilter(q)

  return {
    status: "published",
    ...sectorFilter,
    ...locationFilter,
    ...(textOr ? { OR: textOr } : {}),
  }
}

export function funderDirectoryWhere(
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
