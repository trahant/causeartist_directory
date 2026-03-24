import { SectorForm } from "~/app/admin/sectors/_components/sector-form"
import { Wrapper } from "~/components/common/wrapper"

export default function () {
  return (
    <Wrapper size="md" gap="sm">
      <SectorForm title="Create sector" />
    </Wrapper>
  )
}
