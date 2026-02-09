"use client"

import type { Table } from "@tanstack/react-table"
import { TrashIcon } from "lucide-react"
import type { Report } from "~/.generated/prisma/browser"
import { Button } from "~/components/common/button"
import { DeleteDialog } from "~/components/admin/dialogs/delete-dialog"
import { orpc } from "~/lib/orpc-query"

interface ReportTableToolbarActionsProps {
  table: Table<Report>
}

export const ReportTableToolbarActions = ({ table }: ReportTableToolbarActionsProps) => {
  const { rows } = table.getFilteredSelectedRowModel()

  if (!rows.length) {
    return null
  }

  return (
    <DeleteDialog
      ids={rows.map(row => row.original.id)}
      label="report"
      mutationOptions={orpc.reports.remove.mutationOptions}
      queryKey={orpc.reports.key()}
    >
      <Button variant="secondary" size="md" prefix={<TrashIcon />}>
        Delete ({rows.length})
      </Button>
    </DeleteDialog>
  )
}
