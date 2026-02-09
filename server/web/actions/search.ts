"use server"

import { z } from "zod"
import { ToolStatus } from "~/.generated/prisma/client"
import { getServerSession } from "~/lib/auth"
import { actionClient } from "~/lib/safe-actions"
import { db } from "~/services/db"

export const searchItems = actionClient
  .inputSchema(z.object({ query: z.string() }))
  .action(async ({ parsedInput: { query } }) => {
    const session = await getServerSession()

    const [tools, categories, tags] = await Promise.all([
      db.tool.findMany({
        where: {
          status: session?.user.role === "admin" ? undefined : ToolStatus.Published,
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { tagline: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
          ],
        },
        orderBy: { name: "asc" },
        take: 10,
      }),

      db.category.findMany({
        where: { name: { contains: query, mode: "insensitive" } },
        orderBy: { name: "asc" },
        take: 10,
      }),

      db.tag.findMany({
        where: { name: { contains: query, mode: "insensitive" } },
        orderBy: { name: "asc" },
        take: 10,
      }),
    ])

    return { tools, categories, tags }
  })
