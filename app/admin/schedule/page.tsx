import { Calendar } from "~/app/admin/schedule/calendar"
import { H3 } from "~/components/common/heading"
import { Wrapper } from "~/components/common/wrapper"

export default function () {
  return (
    <Wrapper size="lg" gap="xs">
      <H3>Schedule calendar</H3>

      <Calendar className="w-full" />
    </Wrapper>
  )
}
