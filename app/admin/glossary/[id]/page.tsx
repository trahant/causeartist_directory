import { notFound } from "next/navigation"
import { GlossaryForm } from "~/app/admin/glossary/_components/glossary-form"
import { Wrapper } from "~/components/common/wrapper"
import { findGlossaryTerm } from "~/server/admin/glossary-terms/queries"

export default async function ({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const term = await findGlossaryTerm(id)
  if (!term) notFound()

  return (
    <Wrapper size="md" gap="sm">
      <GlossaryForm title={`Edit: ${term.term}`} term={term} />
    </Wrapper>
  )
}
