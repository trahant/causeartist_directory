import { after } from "next/server"
import * as z from "zod"
import { removeS3Directories } from "~/lib/media"
import { adminProcedure } from "~/lib/orpc"
import { idsSchema } from "~/server/admin/shared/schema"
import { findUsers } from "~/server/admin/users/queries"
import type { UserTableSchema } from "~/server/admin/users/schema"
import { userSchema } from "~/server/admin/users/schema"

const userListSchema = z.object({
  name: z.string().default(""),
  sort: z
    .array(z.object({ id: z.string(), desc: z.boolean() }))
    .default([{ id: "createdAt", desc: true }]),
  page: z.number().default(1),
  perPage: z.number().default(50),
  from: z.string().default(""),
  to: z.string().default(""),
  operator: z.enum(["and", "or"]).default("and"),
})

const list = adminProcedure.input(userListSchema).handler(async ({ input }) => {
  return findUsers(input as UserTableSchema)
})

const update = adminProcedure
  .input(userSchema)
  .handler(async ({ input, context: { db, revalidate } }) => {
    const { id, ...data } = input

    const user = await db.user.update({
      where: { id },
      data,
    })

    revalidate({
      paths: ["/admin/users"],
    })

    return user
  })

const updateRole = adminProcedure
  .input(userSchema.pick({ id: true, role: true }))
  .handler(async ({ input: { id, role }, context: { db, revalidate } }) => {
    const user = await db.user.update({
      where: { id },
      data: { role },
    })

    revalidate({
      paths: ["/admin/users"],
    })

    return user
  })

const remove = adminProcedure
  .input(idsSchema)
  .handler(async ({ input: { ids }, context: { db, revalidate } }) => {
    await db.user.deleteMany({
      where: { id: { in: ids }, role: { not: "admin" } },
    })

    after(async () => {
      await removeS3Directories(ids.map(id => `users/${id}`))
    })

    revalidate({
      paths: ["/admin/users"],
    })

    return true
  })

export const userRouter = {
  list,
  update,
  updateRole,
  remove,
}
