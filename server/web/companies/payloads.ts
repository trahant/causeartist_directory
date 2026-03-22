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

export const companyCertificationsPayload = {
  select: {
    certification: {
      select: {
        name: true,
        slug: true,
        website: true,
      },
    },
  },
} satisfies Prisma.Company$certificationsArgs

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
  heroImageUrl: true,
  keyBenefits: true,
  createdAt: true,
  updatedAt: true,
  sectors: companySectorsPayload,
  locations: companyLocationsPayload,
  subcategories: companySubcategoriesPayload,
  certifications: companyCertificationsPayload,
  funders: {
    where: { funder: { status: "published" } },
    orderBy: { funder: { name: "asc" } },
    select: {
      funder: {
        select: {
          slug: true,
          name: true,
          logoUrl: true,
          type: true,
        },
      },
    },
  },
  caseStudies: {
    where: { status: "published" },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    select: {
      slug: true,
      title: true,
      excerpt: true,
      heroImageUrl: true,
    },
  },
  podcastEpisodes: {
    where: { episode: { status: "published" } },
    orderBy: { episode: { publishedAt: "desc" } },
    select: {
      episode: {
        select: {
          slug: true,
          title: true,
          excerpt: true,
          show: true,
          publishedAt: true,
        },
      },
    },
  },
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
  createdAt: true,
  updatedAt: true,
  sectors: companySectorsPayload,
  locations: companyLocationsPayload,
  subcategories: companySubcategoriesPayload,
  certifications: companyCertificationsPayload,
} satisfies Prisma.CompanySelect

export type CompanyOne = Prisma.CompanyGetPayload<{ select: typeof companyOnePayload }>
export type CompanyMany = Prisma.CompanyGetPayload<{ select: typeof companyManyPayload }>
