import { PrismaPg } from "@prisma/adapter-pg"
import { PHASE_PRODUCTION_BUILD } from "next/constants"
import { PrismaClient } from "~/.generated/prisma/client"
import { env } from "~/env"

const prismaClientSingleton = () => {
  const isBuild = env.NEXT_PHASE === PHASE_PRODUCTION_BUILD
  const isProd = process.env.NODE_ENV === "production"

  // On Vercel serverless, using the pooled "public" URL (pgbouncer/session pooler)
  // prevents connection storms that hit max client limits.
  const connectionString =
    isProd && env.DATABASE_PUBLIC_URL ? env.DATABASE_PUBLIC_URL : env.DATABASE_URL

  // Keep the pool small in production to avoid "MaxClientsInSessionMode" errors.
  const max = isProd ? 2 : isBuild ? 5 : 10
  const adapter = new PrismaPg({ connectionString, max })

  return new PrismaClient({ adapter })
}

declare const globalThis: {
  dbGlobal: ReturnType<typeof prismaClientSingleton>
} & typeof global

const db = globalThis.dbGlobal ?? prismaClientSingleton()

export { db }

if (process.env.NODE_ENV !== "production") globalThis.dbGlobal = db
