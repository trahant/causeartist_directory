import { notFound } from "next/navigation"
import { CertificationForm } from "~/app/admin/certifications/_components/certification-form"
import { Wrapper } from "~/components/common/wrapper"
import { findCertificationByIdForAdmin } from "~/server/admin/certifications/queries"

export default async function ({ params }: PageProps<"/admin/certifications/[id]">) {
  const { id } = await params
  const certification = await findCertificationByIdForAdmin(id)
  if (!certification) notFound()
  return (
    <Wrapper size="md" gap="sm">
      <CertificationForm title={`Edit: ${certification.name}`} certification={certification} />
    </Wrapper>
  )
}
