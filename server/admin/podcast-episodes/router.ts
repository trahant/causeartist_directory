import { createId } from "@paralleldrive/cuid2"
import { ORPCError } from "@orpc/server"
import { episodeProfileHref } from "~/lib/podcast-links"
import { generateUniqueSlug } from "~/lib/slugs"
import { withAdmin } from "~/lib/orpc"
import { findPodcastEpisode, findPodcastEpisodes } from "~/server/admin/podcast-episodes/queries"
import {
  podcastEpisodeCreateSchema,
  podcastEpisodeListSchema,
  podcastEpisodeUpdateSchema,
} from "~/server/admin/podcast-episodes/schema"
import { idSchema, idsSchema } from "~/server/admin/shared/schema"

const emptyToNull = (s: string | null | undefined) => {
  const t = s?.trim()
  return t || null
}

function persistShow(show: "dfg" | "iip" | "generic" | undefined): string | null {
  if (!show || show === "generic") return null
  return show
}

function revalidateEpisodePaths(
  revalidate: (args: { paths?: string[]; tags?: string[] }) => void,
  rows: { show: string | null; slug: string }[],
) {
  const paths = new Set<string>([
    "/podcast",
    "/podcast/disruptors-for-good",
    "/podcast/investing-in-impact",
  ])
  for (const r of rows) {
    paths.add(episodeProfileHref(r))
  }
  revalidate({ paths: [...paths] })
}

const list = withAdmin.input(podcastEpisodeListSchema).handler(async ({ input }) => {
  return findPodcastEpisodes(input)
})

const get = withAdmin.input(idSchema).handler(async ({ input: { id } }) => {
  const row = await findPodcastEpisode(id)
  if (!row) throw new ORPCError("NOT_FOUND", { message: "Podcast episode not found" })
  return row
})

const create = withAdmin.input(podcastEpisodeCreateSchema).handler(async ({ input, context: { db, revalidate } }) => {
  const id = createId()
  const {
    title,
    slug: slugInput,
    status,
    show,
    episodeNumber,
    description,
    content,
    excerpt,
    heroImageUrl,
    spotifyUrl,
    appleUrl,
    youtubeUrl,
    guestName,
    guestTitle,
    guestCompany,
    seoTitle,
    seoDescription,
    publishedAt,
  } = input

  const slug = await generateUniqueSlug(
    slugInput || title,
    s => db.podcastEpisode.findFirst({ where: { slug: s }, select: { id: true } }).then(Boolean),
    undefined,
  )

  const showDb = persistShow(show)

  await db.podcastEpisode.create({
    data: {
      id,
      title,
      slug,
      status,
      show: showDb,
      episodeNumber: episodeNumber ?? null,
      description: emptyToNull(description),
      content: emptyToNull(content),
      excerpt: emptyToNull(excerpt),
      heroImageUrl: emptyToNull(heroImageUrl),
      spotifyUrl: emptyToNull(spotifyUrl),
      appleUrl: emptyToNull(appleUrl),
      youtubeUrl: emptyToNull(youtubeUrl),
      guestName: emptyToNull(guestName),
      guestTitle: emptyToNull(guestTitle),
      guestCompany: emptyToNull(guestCompany),
      seoTitle: emptyToNull(seoTitle),
      seoDescription: emptyToNull(seoDescription),
      publishedAt: publishedAt ?? null,
    },
  })

  const row = await findPodcastEpisode(id)
  const tags = ["podcast-episodes", `podcast-episode-${slug}`]
  revalidate({ tags })
  if (row) revalidateEpisodePaths(revalidate, [{ show: row.show, slug: row.slug }])

  return row
})

const update = withAdmin.input(podcastEpisodeUpdateSchema).handler(async ({ input, context: { db, revalidate } }) => {
  const { id, ...fields } = input
  const existing = await db.podcastEpisode.findUnique({ where: { id } })
  if (!existing) throw new ORPCError("NOT_FOUND", { message: "Podcast episode not found" })

  const nextTitle = fields.title ?? existing.title
  const shouldReSlug = fields.slug !== undefined || fields.title !== undefined
  const slugSource = shouldReSlug ? (emptyToNull(fields.slug) || nextTitle) : existing.slug
  const slug = shouldReSlug
    ? await generateUniqueSlug(
        slugSource,
        s => db.podcastEpisode.findFirst({ where: { slug: s, NOT: { id } }, select: { id: true } }).then(Boolean),
        existing.slug,
      )
    : existing.slug

  const oldSlug = existing.slug

  const showDb =
    fields.show !== undefined ? persistShow(fields.show) : existing.show

  const data = {
    ...(fields.title !== undefined && { title: fields.title }),
    slug,
    ...(fields.status !== undefined && { status: fields.status }),
    show: showDb,
    ...(fields.episodeNumber !== undefined && { episodeNumber: fields.episodeNumber }),
    ...(fields.description !== undefined && { description: emptyToNull(fields.description) }),
    ...(fields.content !== undefined && { content: emptyToNull(fields.content) }),
    ...(fields.excerpt !== undefined && { excerpt: emptyToNull(fields.excerpt) }),
    ...(fields.heroImageUrl !== undefined && { heroImageUrl: emptyToNull(fields.heroImageUrl) }),
    ...(fields.spotifyUrl !== undefined && { spotifyUrl: emptyToNull(fields.spotifyUrl) }),
    ...(fields.appleUrl !== undefined && { appleUrl: emptyToNull(fields.appleUrl) }),
    ...(fields.youtubeUrl !== undefined && { youtubeUrl: emptyToNull(fields.youtubeUrl) }),
    ...(fields.guestName !== undefined && { guestName: emptyToNull(fields.guestName) }),
    ...(fields.guestTitle !== undefined && { guestTitle: emptyToNull(fields.guestTitle) }),
    ...(fields.guestCompany !== undefined && { guestCompany: emptyToNull(fields.guestCompany) }),
    ...(fields.seoTitle !== undefined && { seoTitle: emptyToNull(fields.seoTitle) }),
    ...(fields.seoDescription !== undefined && { seoDescription: emptyToNull(fields.seoDescription) }),
    ...(fields.publishedAt !== undefined && { publishedAt: fields.publishedAt }),
  }

  await db.podcastEpisode.update({ where: { id }, data })

  const row = await findPodcastEpisode(id)
  const tags = new Set<string>(["podcast-episodes", `podcast-episode-${slug}`])
  if (oldSlug !== slug) tags.add(`podcast-episode-${oldSlug}`)
  revalidate({ tags: [...tags] })
  if (row) {
    const pathRows = [{ show: row.show, slug: row.slug }]
    if (oldSlug !== slug) pathRows.push({ show: existing.show, slug: oldSlug })
    revalidateEpisodePaths(revalidate, pathRows)
  }

  return row
})

const remove = withAdmin
  .input(idsSchema)
  .handler(async ({ input: { ids }, context: { db, revalidate } }) => {
    const rows = await db.podcastEpisode.findMany({
      where: { id: { in: ids } },
      select: { slug: true, show: true },
    })
    await db.podcastEpisode.deleteMany({ where: { id: { in: ids } } })
    const tags = new Set<string>(["podcast-episodes"])
    for (const r of rows) {
      tags.add(`podcast-episode-${r.slug}`)
    }
    revalidate({ tags: [...tags] })
    revalidateEpisodePaths(revalidate, rows)
    return true
  })

export const podcastEpisodeRouter = {
  list,
  get,
  create,
  update,
  remove,
}
