import { notFound } from "next/navigation"
import { SectorForm } from "~/app/admin/sectors/_components/sector-form"
import { Wrapper } from "~/components/common/wrapper"
import { findSectorByIdForAdmin } from "~/server/admin/sectors/queries"

export default async function ({ params }: PageProps<"/admin/sectors/[id]">) {
  const { id } = await params
  const sector = await findSectorByIdForAdmin(id)
  if (!sector) notFound()
  return (
    <Wrapper size="md" gap="sm">
      <SectorForm title={`Edit: ${sector.name}`} sector={sector} />
    </Wrapper>
  )
}
