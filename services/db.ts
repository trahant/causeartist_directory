import { PrismaPg } from "@prisma/adapter-pg"
import { PHASE_PRODUCTION_BUILD } from "next/dist/shared/lib/constants"
import { PrismaClient } from "~/.generated/prisma/client"
import { env } from "~/env"

const getConnectionString = () => {
  const usePublicConnection = env.DATABASE_PUBLIC_URL && env.NEXT_PHASE === PHASE_PRODUCTION_BUILD
  return usePublicConnection ? env.DATABASE_PUBLIC_URL : env.DATABASE_URL
}

const prismaClientSingleton = () => {
  const connectionString = getConnectionString()
  const adapter = new PrismaPg({ connectionString })

  return new PrismaClient({ adapter })
}

declare const globalThis: {
  dbGlobal: ReturnType<typeof prismaClientSingleton>
} & typeof global

const db = globalThis.dbGlobal ?? prismaClientSingleton()

export { db }

if (process.env.NODE_ENV !== "production") globalThis.dbGlobal = db
