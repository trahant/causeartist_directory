import { createId } from "@paralleldrive/cuid2"
import { ORPCError } from "@orpc/server"
import { withAdmin } from "~/lib/orpc"
import { generateUniqueSlug } from "~/lib/slugs"
import { findGlossaryTerm, findGlossaryTerms } from "~/server/admin/glossary-terms/queries"
import {
  glossaryTermCreateSchema,
  glossaryTermListSchema,
  glossaryTermUpdateSchema,
} from "~/server/admin/glossary-terms/schema"
import { idSchema, idsSchema } from "~/server/admin/shared/schema"

const emptyToNull = (s: string | null | undefined) => {
  const t = s?.trim()
  return t || null
}

const list = withAdmin.input(glossaryTermListSchema).handler(async ({ input }) => {
  return findGlossaryTerms(input)
})

const get = withAdmin.input(idSchema).handler(async ({ input: { id } }) => {
  const row = await findGlossaryTerm(id)
  if (!row) throw new ORPCError("NOT_FOUND", { message: "Glossary term not found" })
  return row
})

const create = withAdmin.input(glossaryTermCreateSchema).handler(async ({ input, context: { db, revalidate } }) => {
  const id = createId()
  const {
    term,
    slug: slugInput,
    status,
    definition,
    extendedContent,
    seoTitle,
    seoDescription,
  } = input

  const slug = await generateUniqueSlug(
    slugInput || term,
    s => db.glossaryTerm.findFirst({ where: { slug: s }, select: { id: true } }).then(Boolean),
    undefined,
  )

  await db.glossaryTerm.create({
    data: {
      id,
      term,
      slug,
      status,
      definition: emptyToNull(definition),
      extendedContent: emptyToNull(extendedContent),
      seoTitle: emptyToNull(seoTitle),
      seoDescription: emptyToNull(seoDescription),
    },
  })

  const row = await findGlossaryTerm(id)
  revalidate({ tags: ["glossary-terms", `glossary-term-${slug}`], paths: ["/glossary", `/glossary/${slug}`] })
  return row
})

const update = withAdmin.input(glossaryTermUpdateSchema).handler(async ({ input, context: { db, revalidate } }) => {
  const { id, ...fields } = input
  const existing = await db.glossaryTerm.findUnique({ where: { id } })
  if (!existing) throw new ORPCError("NOT_FOUND", { message: "Glossary term not found" })

  const nextTerm = fields.term ?? existing.term
  const shouldReSlug = fields.slug !== undefined || fields.term !== undefined
  const slugSource = shouldReSlug ? (emptyToNull(fields.slug) || nextTerm) : existing.slug
  const slug = shouldReSlug
    ? await generateUniqueSlug(
        slugSource,
        s => db.glossaryTerm.findFirst({ where: { slug: s, NOT: { id } }, select: { id: true } }).then(Boolean),
        existing.slug,
      )
    : existing.slug

  const oldSlug = existing.slug

  await db.glossaryTerm.update({
    where: { id },
    data: {
      ...(fields.term !== undefined && { term: fields.term }),
      slug,
      ...(fields.status !== undefined && { status: fields.status }),
      ...(fields.definition !== undefined && { definition: emptyToNull(fields.definition) }),
      ...(fields.extendedContent !== undefined && { extendedContent: emptyToNull(fields.extendedContent) }),
      ...(fields.seoTitle !== undefined && { seoTitle: emptyToNull(fields.seoTitle) }),
      ...(fields.seoDescription !== undefined && { seoDescription: emptyToNull(fields.seoDescription) }),
    },
  })

  const row = await findGlossaryTerm(id)
  const tags = new Set<string>(["glossary-terms", `glossary-term-${slug}`])
  if (oldSlug !== slug) tags.add(`glossary-term-${oldSlug}`)
  revalidate({ tags: [...tags], paths: ["/glossary", `/glossary/${slug}`, `/glossary/${oldSlug}`] })
  return row
})

const remove = withAdmin
  .input(idsSchema)
  .handler(async ({ input: { ids }, context: { db, revalidate } }) => {
    const rows = await db.glossaryTerm.findMany({
      where: { id: { in: ids } },
      select: { slug: true },
    })
    await db.glossaryTerm.deleteMany({ where: { id: { in: ids } } })
    const tags = new Set<string>(["glossary-terms"])
    for (const r of rows) {
      tags.add(`glossary-term-${r.slug}`)
    }
    revalidate({
      tags: [...tags],
      paths: ["/glossary", ...rows.map(r => `/glossary/${r.slug}`)],
    })
    return true
  })

export const glossaryTermRouter = {
  list,
  get,
  create,
  update,
  remove,
}
