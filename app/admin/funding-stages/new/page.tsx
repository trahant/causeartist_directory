import { FundingStageForm } from "~/app/admin/funding-stages/_components/funding-stage-form"
import { Wrapper } from "~/components/common/wrapper"

export default function () {
  return (
    <Wrapper size="md" gap="sm">
      <FundingStageForm title="Create funding stage" />
    </Wrapper>
  )
}
