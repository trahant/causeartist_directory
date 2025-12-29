"use client"

import type { Table } from "@tanstack/react-table"
import { TrashIcon } from "lucide-react"
import type { Report } from "~/.generated/prisma/browser"
import { Button } from "~/components/common/button"
import { ReportDeleteDialog } from "./report-delete-dialog"

interface ReportTableToolbarActionsProps {
  table: Table<Report>
}

export const ReportTableToolbarActions = ({ table }: ReportTableToolbarActionsProps) => {
  const { rows } = table.getFilteredSelectedRowModel()

  if (!rows.length) {
    return null
  }

  return (
    <ReportDeleteDialog reports={rows.map(row => row.original)}>
      <Button variant="secondary" size="md" prefix={<TrashIcon />}>
        Delete ({rows.length})
      </Button>
    </ReportDeleteDialog>
  )
}
