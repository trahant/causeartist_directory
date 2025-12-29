import type { PropsWithChildren } from "react"
import { toast } from "sonner"
import type { Category } from "~/.generated/prisma/client"
import { DeleteDialog } from "~/components/admin/dialogs/delete-dialog"
import { deleteCategories } from "~/server/admin/categories/actions"

type CategoryDeleteDialogProps = PropsWithChildren<{
  categories: Category[]
  onExecute?: () => void
}>

export const CategoryDeleteDialog = ({
  categories,
  onExecute,
  ...props
}: CategoryDeleteDialogProps) => {
  return (
    <DeleteDialog
      ids={categories.map(({ id }) => id)}
      label="category"
      action={deleteCategories}
      callbacks={{
        onExecute: () => {
          toast.success("Categories deleted successfully")
          onExecute?.()
        },
        onError: ({ error }) => toast.error(error.serverError),
      }}
      {...props}
    />
  )
}
