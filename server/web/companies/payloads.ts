import type { Prisma } from "~/.generated/prisma/client"
import { sectorManyPayload } from "~/server/web/sectors/payloads"
import { locationManyPayload } from "~/server/web/locations/payloads"

export const companySectorsPayload = {
  select: { sector: { select: sectorManyPayload } },
  orderBy: { sector: { name: "asc" } },
} satisfies Prisma.Company$sectorsArgs

export const companyLocationsPayload = {
  select: { location: { select: locationManyPayload } },
  orderBy: { location: { name: "asc" } },
} satisfies Prisma.Company$locationsArgs

export const companySubcategoriesPayload = {
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
} satisfies Prisma.Company$subcategoriesArgs

export const companyOnePayload = {
  id: true,
  name: true,
  slug: true,
  status: true,
  tagline: true,
  description: true,
  logoUrl: true,
  website: true,
  foundedYear: true,
  totalFunding: true,
  linkedin: true,
  twitter: true,
  founderName: true,
  impactModel: true,
  impactMetrics: true,
  seoTitle: true,
  seoDescription: true,
  createdAt: true,
  updatedAt: true,
  sectors: companySectorsPayload,
  locations: companyLocationsPayload,
  subcategories: companySubcategoriesPayload,
} satisfies Prisma.CompanySelect

export const companyManyPayload = {
  id: true,
  name: true,
  slug: true,
  tagline: true,
  description: true,
  logoUrl: true,
  website: true,
  foundedYear: true,
  status: true,
  updatedAt: true,
  sectors: companySectorsPayload,
  locations: companyLocationsPayload,
  subcategories: companySubcategoriesPayload,
} satisfies Prisma.CompanySelect

export type CompanyOne = Prisma.CompanyGetPayload<{ select: typeof companyOnePayload }>
export type CompanyMany = Prisma.CompanyGetPayload<{ select: typeof companyManyPayload }>
