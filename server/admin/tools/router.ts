import { after } from "next/server"
import { z } from "zod"
import { removeS3Directories } from "~/lib/media"
import { notifySubmitterOfToolPublished, notifySubmitterOfToolScheduled } from "~/lib/notifications"
import { withAdmin } from "~/lib/orpc"
import { generateUniqueSlug } from "~/lib/slugs"
import { idSchema, idsSchema } from "~/server/admin/shared/schema"
import { findScheduledTools, findToolList, findTools } from "~/server/admin/tools/queries"
import { toolListSchema, toolSchema } from "~/server/admin/tools/schema"

const list = withAdmin.input(toolListSchema).handler(async ({ input }) => {
  return findTools(input)
})

const lookup = withAdmin.handler(async () => {
  return findToolList()
})

const scheduled = withAdmin
  .input(z.object({ start: z.coerce.date(), end: z.coerce.date() }))
  .handler(async ({ input: { start, end } }) => {
    return findScheduledTools({
      where: { publishedAt: { gte: start, lte: end } },
    })
  })

const upsert = withAdmin
  .input(toolSchema)
  .handler(async ({ input, context: { db, revalidate } }) => {
    const { id, categories, tags, notifySubmitter, ...data } = input
    const categoryIds = categories?.map(id => ({ id }))
    const tagIds = tags?.map(id => ({ id }))
    const existingTool = await db.tool.findUnique({ where: { id } })

    const slug = await generateUniqueSlug(
      data.slug || data.name,
      slug => db.tool.findUnique({ where: { slug }, select: { slug: true } }).then(Boolean),
      existingTool?.slug,
    )

    const tool = await db.tool.upsert({
      where: { id },
      create: {
        id,
        ...data,
        slug,
        categories: { connect: categoryIds },
        tags: { connect: tagIds },
      },
      update: {
        ...data,
        slug,
        categories: { set: categoryIds },
        tags: { set: tagIds },
      },
    })

    after(async () => {
      if (notifySubmitter && (!existingTool || existingTool.status !== tool.status)) {
        await notifySubmitterOfToolPublished(tool)
        await notifySubmitterOfToolScheduled(tool)
      }
    })

    revalidate({
      tags: ["tools", `tool-${tool.slug}`, "schedule"],
    })

    return tool
  })

const duplicate = withAdmin
  .input(idSchema)
  .handler(async ({ input: { id }, context: { db, revalidate } }) => {
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

    const name = `${tool.name} (Copy)`

    const slug = await generateUniqueSlug(name, slug =>
      db.tool.findUnique({ where: { slug }, select: { slug: true } }).then(Boolean),
    )

    const newTool = await db.tool.create({
      data: {
        name,
        slug,
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
      tags: ["tools"],
    })

    return newTool
  })

const remove = withAdmin
  .input(idsSchema)
  .handler(async ({ input: { ids }, context: { db, revalidate } }) => {
    await db.tool.deleteMany({
      where: { id: { in: ids } },
    })

    after(async () => {
      await removeS3Directories(ids.map(id => `tools/${id}`))
    })

    revalidate({
      tags: ["tools"],
    })

    return true
  })

export const toolRouter = {
  list,
  lookup,
  scheduled,
  upsert,
  duplicate,
  remove,
}
