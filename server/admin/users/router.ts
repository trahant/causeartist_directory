import { after } from "next/server"
import { removeS3Directories } from "~/lib/media"
import { withAdmin } from "~/lib/orpc"
import { idsSchema } from "~/server/admin/shared/schema"
import { findUserList, findUsers } from "~/server/admin/users/queries"
import { userListSchema, userSchema } from "~/server/admin/users/schema"

const list = withAdmin.input(userListSchema).handler(async ({ input }) => {
  return findUsers(input)
})

const update = withAdmin.input(userSchema).handler(async ({ input, context: { db } }) => {
  const { id, ...data } = input

  return db.user.update({
    where: { id },
    data,
  })
})

const updateRole = withAdmin
  .input(userSchema.pick({ id: true, role: true }))
  .handler(async ({ input: { id, role }, context: { db } }) => {
    return db.user.update({
      where: { id },
      data: { role },
    })
  })

const remove = withAdmin.input(idsSchema).handler(async ({ input: { ids }, context: { db } }) => {
  await db.user.deleteMany({
    where: { id: { in: ids }, role: { not: "admin" } },
  })

  after(async () => {
    await removeS3Directories(ids.map(id => `users/${id}`))
  })

  return true
})

const lookup = withAdmin.handler(async () => {
  return findUserList()
})

export const userRouter = {
  list,
  lookup,
  update,
  updateRole,
  remove,
}
