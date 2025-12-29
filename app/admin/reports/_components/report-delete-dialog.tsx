import type { PropsWithChildren } from "react"
import { toast } from "sonner"
import type { Report } from "~/.generated/prisma/client"
import { DeleteDialog } from "~/components/admin/dialogs/delete-dialog"
import { deleteReports } from "~/server/admin/reports/actions"

type ReportDeleteDialogProps = PropsWithChildren<{
  reports: Report[]
  onExecute?: () => void
}>

export const ReportDeleteDialog = ({ reports, onExecute, ...props }: ReportDeleteDialogProps) => {
  return (
    <DeleteDialog
      ids={reports.map(({ id }) => id)}
      label="report"
      action={deleteReports}
      callbacks={{
        onExecute: () => {
          toast.success("Report(s) deleted successfully")
          onExecute?.()
        },
        onError: ({ error }) => toast.error(error.serverError),
      }}
      {...props}
    />
  )
}
