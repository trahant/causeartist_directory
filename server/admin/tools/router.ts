import { after } from "next/server"
import * as z from "zod"
import { ToolStatus } from "~/.generated/prisma/client"
import { removeS3Directories } from "~/lib/media"
import { notifySubmitterOfToolPublished, notifySubmitterOfToolScheduled } from "~/lib/notifications"
import { adminProcedure } from "~/lib/orpc"
import { idSchema, idsSchema } from "~/server/admin/shared/schema"
import { findTools } from "~/server/admin/tools/queries"
import type { ToolTableSchema } from "~/server/admin/tools/schema"
import { toolSchema } from "~/server/admin/tools/schema"

const toolListSchema = z.object({
  name: z.string().default(""),
  sort: z
    .array(z.object({ id: z.string(), desc: z.boolean() }))
    .default([{ id: "createdAt", desc: true }]),
  page: z.number().default(1),
  perPage: z.number().default(25),
  from: z.string().default(""),
  to: z.string().default(""),
  operator: z.enum(["and", "or"]).default("and"),
  status: z.array(z.enum(ToolStatus)).default([]),
})

const list = adminProcedure.input(toolListSchema).handler(async ({ input }) => {
  return findTools(input as ToolTableSchema)
})

const upsert = adminProcedure.input(toolSchema).handler(async ({ input, context: { db, revalidate } }) => {
  const { id, categories, tags, notifySubmitter, ...data } = input
  const categoryIds = categories?.map(id => ({ id }))
  const tagIds = tags?.map(id => ({ id }))
  const existingTool = id ? await db.tool.findUnique({ where: { id } }) : null

  const tool = id
    ? await db.tool.update({
        where: { id },
        data: {
          ...data,
          slug: data.slug || "",
          categories: { set: categoryIds },
          tags: { set: tagIds },
        },
      })
    : await db.tool.create({
        data: {
          ...data,
          slug: data.slug || "",
          categories: { connect: categoryIds },
          tags: { connect: tagIds },
        },
      })

  after(async () => {
    if (notifySubmitter && (!existingTool || existingTool.status !== tool.status)) {
      await notifySubmitterOfToolPublished(tool)
      await notifySubmitterOfToolScheduled(tool)
    }
  })

  revalidate({
    paths: ["/admin/tools"],
    tags: ["tools", `tool-${tool.slug}`, "schedule"],
  })

  return tool
})

const duplicate = adminProcedure.input(idSchema).handler(async ({ input: { id }, context: { db, revalidate } }) => {
  const tool = await db.tool.findUnique({
    where: { id },
    include: {
      categories: { select: { id: true } },
      tags: { select: { id: true } },
    },
  })

  if (!tool) {
    throw new Error("Tool not found")
  }

  const newTool = await db.tool.create({
    data: {
      name: `${tool.name} (Copy)`,
      slug: "",
      websiteUrl: tool.websiteUrl,
      affiliateUrl: tool.affiliateUrl,
      tagline: tool.tagline,
      description: tool.description,
      content: tool.content,
      faviconUrl: tool.faviconUrl,
      screenshotUrl: tool.screenshotUrl,
      categories: { connect: tool.categories },
      tags: { connect: tool.tags },
    },
  })

  revalidate({
    paths: ["/admin/tools"],
    tags: ["tools"],
  })

  return newTool
})

const remove = adminProcedure.input(idsSchema).handler(async ({ input: { ids }, context: { db, revalidate } }) => {
  const tools = await db.tool.findMany({
    where: { id: { in: ids } },
    select: { slug: true },
  })

  await db.tool.deleteMany({
    where: { id: { in: ids } },
  })

  after(async () => {
    await removeS3Directories(tools.map(({ slug }) => `tools/${slug}`))
  })

  revalidate({
    paths: ["/admin/tools"],
    tags: ["tools"],
  })

  return true
})

export const toolRouter = {
  list,
  upsert,
  duplicate,
  remove,
}
