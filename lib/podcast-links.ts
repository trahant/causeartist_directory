/** Canonical path for a podcast episode detail page (matches `app/(web)/podcast` routing). */
export function episodeProfileHref(episode: { show: string | null; slug: string }): string {
  if (episode.show === "dfg") return `/podcast/disruptors-for-good/${episode.slug}`
  if (episode.show === "iip") return `/podcast/investing-in-impact/${episode.slug}`
  return `/podcast/${episode.slug}`
}
