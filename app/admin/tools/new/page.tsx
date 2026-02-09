import { ToolForm } from "~/app/admin/tools/_components/tool-form"
import { Wrapper } from "~/components/common/wrapper"

export default function () {
  return (
    <Wrapper size="md" gap="sm">
      <ToolForm title="Create tool" />
    </Wrapper>
  )
}
