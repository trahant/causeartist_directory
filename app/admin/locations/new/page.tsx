import { LocationForm } from "~/app/admin/locations/_components/location-form"
import { Wrapper } from "~/components/common/wrapper"

export default function () {
  return (
    <Wrapper size="md" gap="sm">
      <LocationForm title="Create location" />
    </Wrapper>
  )
}
