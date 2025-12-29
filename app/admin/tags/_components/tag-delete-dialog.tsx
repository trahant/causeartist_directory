import type { PropsWithChildren } from "react"
import { toast } from "sonner"
import type { Tag } from "~/.generated/prisma/client"
import { DeleteDialog } from "~/components/admin/dialogs/delete-dialog"
import { deleteTags } from "~/server/admin/tags/actions"

type TagDeleteDialogProps = PropsWithChildren<{
  tags: Tag[]
  onExecute?: () => void
}>

export const TagDeleteDialog = ({ tags, onExecute, ...props }: TagDeleteDialogProps) => {
  return (
    <DeleteDialog
      ids={tags.map(({ id }) => id)}
      label="tag"
      action={deleteTags}
      callbacks={{
        onExecute: () => {
          toast.success("Tag(s) deleted successfully")
          onExecute?.()
        },
        onError: ({ error }) => toast.error(error.serverError),
      }}
      {...props}
    />
  )
}
