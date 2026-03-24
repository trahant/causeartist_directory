import { CertificationForm } from "~/app/admin/certifications/_components/certification-form"
import { Wrapper } from "~/components/common/wrapper"

export default function () {
  return (
    <Wrapper size="md" gap="sm">
      <CertificationForm title="Create certification" />
    </Wrapper>
  )
}
