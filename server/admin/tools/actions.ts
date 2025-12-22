"use server"

import { after } from "next/server"
import { removeS3Directories } from "~/lib/media"
import { notifySubmitterOfToolPublished, notifySubmitterOfToolScheduled } from "~/lib/notifications"
import { adminActionClient } from "~/lib/safe-actions"
import { idSchema, idsSchema } from "~/server/admin/shared/schema"
import { toolSchema } from "~/server/admin/tools/schema"

export const upsertTool = adminActionClient
  .inputSchema(toolSchema)
  .action(async ({ parsedInput, ctx: { db, revalidate } }) => {
    const { id, categories, tags, notifySubmitter, ...input } = parsedInput
    const categoryIds = categories?.map(id => ({ id }))
    const tagIds = tags?.map(id => ({ id }))
    const existingTool = id ? await db.tool.findUnique({ where: { id } }) : null

    const tool = id
      ? // If the tool exists, update it
        await db.tool.update({
          where: { id },
          data: {
            ...input,
            slug: input.slug || "",
            categories: { set: categoryIds },
            tags: { set: tagIds },
          },
        })
      : // Otherwise, create it
        await db.tool.create({
          data: {
            ...input,
            slug: input.slug || "",
            categories: { connect: categoryIds },
            tags: { connect: tagIds },
          },
        })

    // Handle notifications asynchronously
    after(async () => {
      if (notifySubmitter && (!existingTool || existingTool.status !== tool.status)) {
        // Notify the submitter of the tool published
        await notifySubmitterOfToolPublished(tool)

        // Notify the submitter of the tool scheduled for publication
        await notifySubmitterOfToolScheduled(tool)
      }
    })

    revalidate({
      paths: ["/admin/tools"],
      tags: ["tools", `tool-${tool.slug}`, "schedule"],
    })

    return tool
  })

export const duplicateTool = adminActionClient
  .inputSchema(idSchema)
  .action(async ({ parsedInput: { id }, ctx: { db, revalidate } }) => {
    const originalTool = await db.tool.findUnique({
      where: { id },
      include: {
        categories: { select: { id: true } },
        tags: { select: { id: true } },
      },
    })

    if (!originalTool) {
      throw new Error("Tool not found")
    }

    const newName = `${originalTool.name} (Copy)`

    const duplicatedTool = await db.tool.create({
      data: {
        name: newName,
        slug: "", // Slug will be auto-generated
        websiteUrl: originalTool.websiteUrl,
        affiliateUrl: originalTool.affiliateUrl,
        tagline: originalTool.tagline,
        description: originalTool.description,
        content: originalTool.content,
        faviconUrl: originalTool.faviconUrl,
        screenshotUrl: originalTool.screenshotUrl,
        categories: { connect: originalTool.categories },
        tags: { connect: originalTool.tags },
      },
    })

    revalidate({
      paths: ["/admin/tools"],
      tags: ["tools"],
    })

    return duplicatedTool
  })

export const deleteTools = adminActionClient
  .inputSchema(idsSchema)
  .action(async ({ parsedInput: { ids }, ctx: { db, revalidate } }) => {
    const tools = await db.tool.findMany({
      where: { id: { in: ids } },
      select: { slug: true },
    })

    await db.tool.deleteMany({
      where: { id: { in: ids } },
    })

    // Remove the tool images from S3 asynchronously
    after(async () => {
      await removeS3Directories(tools.map(({ slug }) => `tools/${slug}`))
    })

    revalidate({
      paths: ["/admin/tools"],
      tags: ["tools"],
    })

    return true
  })
