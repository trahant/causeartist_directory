import { defineCollection, defineConfig } from "@content-collections/core"
import { compileMDX, type Options } from "@content-collections/mdx"
import rehypeAutolinkHeadings from "rehype-autolink-headings"
import rehypeSlug from "rehype-slug"
import remarkGfm from "remark-gfm"
import { z } from "zod"
import { defaultLocale, locales } from "~/lib/i18n-config"
import { extractHeadingsFromMDX, extractToolsFromMDX } from "~/lib/mdx"

const mdxOptions: Options = {
  rehypePlugins: [rehypeSlug, rehypeAutolinkHeadings],
  remarkPlugins: [[remarkGfm]],
}

const posts = defineCollection({
  name: "posts",
  directory: "content/posts",
  include: "**/*.{md,mdx}",

  schema: z.object({
    content: z.string(),
    title: z.string(),
    description: z.string(),
    image: z.string().optional(),
    publishedAt: z.string().pipe(z.coerce.date()),
    updatedAt: z.string().pipe(z.coerce.date()).optional(),
    author: z
      .object({
        name: z.string(),
        image: z.string(),
        url: z.string().optional(),
      })
      .optional(),
    locale: z.enum(locales).default(defaultLocale),
    headings: z
      .array(
        z.object({
          id: z.string(),
          text: z.string(),
          level: z.number(),
        }),
      )
      .optional(),
    tools: z.array(z.string()).optional(),
  }),

  transform: async (data, context) => {
    const tools = extractToolsFromMDX(data.content)
    const headings = extractHeadingsFromMDX(data.content)
    const content = await compileMDX(context, data, mdxOptions)

    return { ...data, content, headings, tools }
  },
})

export default defineConfig({
  collections: [posts],
})
