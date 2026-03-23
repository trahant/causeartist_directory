import { notFound } from "next/navigation"
import { FunderForm } from "~/app/admin/funders/_components/funder-form"
import { Wrapper } from "~/components/common/wrapper"
import {
  findFunderByIdForAdmin,
  findTaxonomyForFunderAdmin,
} from "~/server/admin/funders/queries"

export default async function ({ params }: PageProps<"/admin/funders/[id]">) {
  const { id } = await params
  const [funder, taxonomy] = await Promise.all([
    findFunderByIdForAdmin(id),
    findTaxonomyForFunderAdmin(),
  ])

  if (!funder) {
    notFound()
  }

  return (
    <Wrapper size="md" gap="sm">
      <FunderForm title={`Edit ${funder.name}`} funder={funder} taxonomy={taxonomy} />
    </Wrapper>
  )
}
