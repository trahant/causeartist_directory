/**
 * Deletes default DirStarter/Causeartist seed tools by slug (allowlist only).
 * Safe for DBs that may have other Tool rows you want to keep.
 * Run: bun scripts/remove-seed-tools.ts
 */
import { db } from "~/services/db"

/** Slugs from historical prisma/seed.ts toolsData */
const SEED_TOOL_SLUGS = [
  "vscode",
  "nextjs",
  "docker",
  "figma",
  "nodejs",
  "claude",
  "jest",
  "aws",
  "mdn-web-docs",
  "chatgpt",
  "tailwind-css",
  "react",
  "postman",
  "github",
  "sveltekit",
  "rust",
  "kubernetes",
] as const

async function main() {
  const result = await db.tool.deleteMany({
    where: { slug: { in: [...SEED_TOOL_SLUGS] } },
  })
  console.log(`Deleted ${result.count} tool(s) matching seed slug allowlist.`)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
