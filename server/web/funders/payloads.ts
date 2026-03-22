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
  heroImageUrl: true,
  keyBenefits: true,
  createdAt: true,
  updatedAt: true,
  sectors: funderSectorsPayload,
  locations: funderLocationsPayload,
  subcategories: funderSubcategoriesPayload,
  portfolio: {
    where: { company: { status: "published" } },
    orderBy: { company: { name: "asc" } },
    select: {
      company: {
        select: {
          slug: true,
          name: true,
          logoUrl: true,
          tagline: true,
        },
      },
    },
  },
  stages: {
    orderBy: { fundingStage: { name: "asc" } },
    select: {
      fundingStage: {
        select: {
          name: true,
          slug: true,
        },
      },
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
  createdAt: true,
  updatedAt: true,
  sectors: funderSectorsPayload,
  locations: funderLocationsPayload,
  subcategories: funderSubcategoriesPayload,
} satisfies Prisma.FunderSelect

export type FunderOne = Prisma.FunderGetPayload<{ select: typeof funderOnePayload }>
export type FunderMany = Prisma.FunderGetPayload<{ select: typeof funderManyPayload }>
