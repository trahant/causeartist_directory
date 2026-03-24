import { notFound } from "next/navigation"
import { LocationForm } from "~/app/admin/locations/_components/location-form"
import { Wrapper } from "~/components/common/wrapper"
import { findLocationByIdForAdmin } from "~/server/admin/locations/queries"

export default async function ({ params }: PageProps<"/admin/locations/[id]">) {
  const { id } = await params
  const location = await findLocationByIdForAdmin(id)
  if (!location) notFound()
  return (
    <Wrapper size="md" gap="sm">
      <LocationForm title={`Edit: ${location.name}`} location={location} />
    </Wrapper>
  )
}
