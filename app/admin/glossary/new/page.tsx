import { GlossaryForm } from "~/app/admin/glossary/_components/glossary-form"
import { Wrapper } from "~/components/common/wrapper"

export default function () {
  return (
    <Wrapper size="md" gap="sm">
      <GlossaryForm title="Create glossary term" />
    </Wrapper>
  )
}
