import { notFound } from "next/navigation"
import { EpisodeForm } from "~/app/admin/podcast-episodes/_components/episode-form"
import { Wrapper } from "~/components/common/wrapper"
import { findPodcastEpisode } from "~/server/admin/podcast-episodes/queries"

export default async function ({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const episode = await findPodcastEpisode(id)
  if (!episode) notFound()

  return (
    <Wrapper size="md" gap="sm">
      <EpisodeForm title={`Edit: ${episode.title}`} episode={episode} />
    </Wrapper>
  )
}
