import type { Prisma } from "~/.generated/prisma/client"
import { sectorManyPayload } from "~/server/web/sectors/payloads"
import { locationManyPayload } from "~/server/web/locations/payloads"

export const funderSectorsPayload = {
  select: { sector: { select: sectorManyPayload } },
  orderBy: { sector: { name: "asc" } },
} satisfies Prisma.Funder$sectorsArgs

export const funderLocationsPayload = {
  select: { location: { select: locationManyPayload } },
  orderBy: { location: { name: "asc" } },
} satisfies Prisma.Funder$locationsArgs

export const funderSubcategoriesPayload = {
  select: {
    subcategory: {
      select: {
        id: true,
        name: true,
        slug: true,
      },
    },
  },
  orderBy: { subcategory: { name: "asc" } },
} satisfies Prisma.Funder$subcategoriesArgs

export const funderOnePayload = {
  id: true,
  name: true,
  slug: true,
  status: true,
  type: true,
  description: true,
  logoUrl: true,
  website: true,
  foundedYear: true,
  aum: true,
  checkSizeMin: true,
  checkSizeMax: true,
  investmentThesis: true,
  applicationUrl: true,
  linkedin: true,
  seoTitle: true,
  seoDescription: true,
  createdAt: true,
  updatedAt: true,
  sectors: funderSectorsPayload,
  locations: funderLocationsPayload,
  subcategories: funderSubcategoriesPayload,
} satisfies Prisma.FunderSelect

export const funderManyPayload = {
  id: true,
  name: true,
  slug: true,
  type: true,
  description: true,
  logoUrl: true,
  website: true,
  foundedYear: true,
  status: true,
  updatedAt: true,
  sectors: funderSectorsPayload,
  locations: funderLocationsPayload,
  subcategories: funderSubcategoriesPayload,
} satisfies Prisma.FunderSelect

export type FunderOne = Prisma.FunderGetPayload<{ select: typeof funderOnePayload }>
export type FunderMany = Prisma.FunderGetPayload<{ select: typeof funderManyPayload }>
