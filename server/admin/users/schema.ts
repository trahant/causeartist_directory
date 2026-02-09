import {
  createSearchParamsCache,
  createStandardSchemaV1,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server"
import { z } from "zod"
import type { User } from "~/.generated/prisma/browser"
import { getSortingStateParser } from "~/lib/parsers"

export const userListParams = {
  name: parseAsString.withDefault(""),
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(50),
  sort: getSortingStateParser<User>().withDefault([{ id: "createdAt", desc: true }]),
  from: parseAsString.withDefault(""),
  to: parseAsString.withDefault(""),
  operator: parseAsStringEnum(["and", "or"]).withDefault("and"),
}

export const userListSchema = createStandardSchemaV1(userListParams)
export const userListCache = createSearchParamsCache(userListParams)
export type UserListParams = Awaited<ReturnType<typeof userListCache.parse>>

export const userSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  email: z.email("Invalid email").optional().or(z.literal("")),
  image: z.url().optional().or(z.literal("")),
  role: z.enum(["admin", "user"]).optional(),
})

export type UserSchema = z.infer<typeof userSchema>
