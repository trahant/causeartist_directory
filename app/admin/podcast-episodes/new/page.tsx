import { EpisodeForm } from "~/app/admin/podcast-episodes/_components/episode-form"
import { Wrapper } from "~/components/common/wrapper"

export default function () {
  return (
    <Wrapper size="md" gap="sm">
      <EpisodeForm title="Create podcast episode" />
    </Wrapper>
  )
}
