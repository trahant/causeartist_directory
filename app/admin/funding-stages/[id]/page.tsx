import { notFound } from "next/navigation"
import { FundingStageForm } from "~/app/admin/funding-stages/_components/funding-stage-form"
import { Wrapper } from "~/components/common/wrapper"
import { findFundingStageByIdForAdmin } from "~/server/admin/funding-stages/queries"

export default async function ({ params }: PageProps<"/admin/funding-stages/[id]">) {
  const { id } = await params
  const fundingStage = await findFundingStageByIdForAdmin(id)
  if (!fundingStage) notFound()
  return (
    <Wrapper size="md" gap="sm">
      <FundingStageForm title={`Edit: ${fundingStage.name}`} fundingStage={fundingStage} />
    </Wrapper>
  )
}
