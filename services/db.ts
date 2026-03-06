import { PrismaPg } from "@prisma/adapter-pg"
import { PHASE_PRODUCTION_BUILD } from "next/constants"
import { PrismaClient } from "~/.generated/prisma/client"
import { env } from "~/env"

const prismaClientSingleton = () => {
  const isBuild = env.NEXT_PHASE === PHASE_PRODUCTION_BUILD
  const connectionString = (isBuild && env.DATABASE_PUBLIC_URL) || env.DATABASE_URL
  const adapter = new PrismaPg({ connectionString, max: isBuild ? 5 : 10 })

  return new PrismaClient({ adapter })
}

declare const globalThis: {
  dbGlobal: ReturnType<typeof prismaClientSingleton>
} & typeof global

const db = globalThis.dbGlobal ?? prismaClientSingleton()

export { db }

if (process.env.NODE_ENV !== "production") globalThis.dbGlobal = db
