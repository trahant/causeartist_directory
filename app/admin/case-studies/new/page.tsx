import { CaseStudyForm } from "~/app/admin/case-studies/_components/case-study-form"
import { Wrapper } from "~/components/common/wrapper"

export default function () {
  return (
    <Wrapper size="md" gap="sm">
      <CaseStudyForm title="Create case study" />
    </Wrapper>
  )
}
