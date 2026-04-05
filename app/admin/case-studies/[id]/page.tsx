import { notFound } from "next/navigation"
import { CaseStudyForm } from "~/app/admin/case-studies/_components/case-study-form"
import { Wrapper } from "~/components/common/wrapper"
import { findCaseStudyByIdForAdmin } from "~/server/admin/case-studies/queries"

export default async function ({ params }: PageProps<"/admin/case-studies/[id]">) {
  const { id } = await params
  const caseStudy = await findCaseStudyByIdForAdmin(id)
  if (!caseStudy) notFound()

  return (
    <Wrapper size="md" gap="sm">
      <CaseStudyForm title={`Edit: ${caseStudy.title}`} caseStudy={caseStudy} />
    </Wrapper>
  )
}
