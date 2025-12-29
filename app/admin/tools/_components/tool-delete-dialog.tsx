import type { PropsWithChildren } from "react"
import { toast } from "sonner"
import type { Tool } from "~/.generated/prisma/browser"
import { DeleteDialog } from "~/components/admin/dialogs/delete-dialog"
import { deleteTools } from "~/server/admin/tools/actions"

type ToolDeleteDialogProps = PropsWithChildren<{
  tools: Tool[]
  onExecute?: () => void
}>

export const ToolDeleteDialog = ({ tools, onExecute, ...props }: ToolDeleteDialogProps) => {
  return (
    <DeleteDialog
      ids={tools.map(({ id }) => id)}
      label="tool"
      action={deleteTools}
      callbacks={{
        onExecute: () => {
          toast.success("Tool(s) deleted successfully")
          onExecute?.()
        },
        onError: ({ error }) => toast.error(error.serverError),
      }}
      {...props}
    />
  )
}
