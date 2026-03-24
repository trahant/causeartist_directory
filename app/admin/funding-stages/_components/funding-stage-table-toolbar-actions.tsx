"use client"

import type { Table } from "@tanstack/react-table"
import { TrashIcon } from "lucide-react"
import { DeleteDialog } from "~/components/admin/dialogs/delete-dialog"
import { Button } from "~/components/common/button"
import { orpc } from "~/lib/orpc-query"
import type { FundingStageListRow } from "~/server/admin/funding-stages/schema"

export function FundingStageTableToolbarActions({ table }: { table: Table<FundingStageListRow> }) {
  const { rows } = table.getFilteredSelectedRowModel()
  if (!rows.length) return null
  return (
    <DeleteDialog
      ids={rows.map(r => r.original.id)}
      label="funding stage"
      mutationOptions={orpc.admin.fundingStages.remove.mutationOptions}
      queryKey={orpc.admin.fundingStages.key()}
    >
      <Button variant="secondary" size="md" prefix={<TrashIcon />}>
        Delete ({rows.length})
      </Button>
    </DeleteDialog>
  )
}
