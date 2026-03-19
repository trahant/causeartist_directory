import type { Prisma } from "~/.generated/prisma/client"

export const certificationManyPayload = {
  id: true,
  name: true,
  slug: true,
  description: true,
  website: true,
} satisfies Prisma.CertificationSelect

export const certificationOnePayload = {
  id: true,
  name: true,
  slug: true,
  description: true,
  website: true,
  createdAt: true,
} satisfies Prisma.CertificationSelect

export type CertificationOne = Prisma.CertificationGetPayload<{
  select: typeof certificationOnePayload
}>
export type CertificationMany = Prisma.CertificationGetPayload<{
  select: typeof certificationManyPayload
}>
