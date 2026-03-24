"use client"

import type { Table } from "@tanstack/react-table"
import { TrashIcon } from "lucide-react"
import { DeleteDialog } from "~/components/admin/dialogs/delete-dialog"
import { Button } from "~/components/common/button"
import { orpc } from "~/lib/orpc-query"
import type { SectorListRow } from "~/server/admin/sectors/schema"

export function SectorTableToolbarActions({ table }: { table: Table<SectorListRow> }) {
  const { rows } = table.getFilteredSelectedRowModel()
  if (!rows.length) return null
  return (
    <DeleteDialog
      ids={rows.map(r => r.original.id)}
      label="sector"
      mutationOptions={orpc.admin.sectors.remove.mutationOptions}
      queryKey={orpc.admin.sectors.key()}
    >
      <Button variant="secondary" size="md" prefix={<TrashIcon />}>
        Delete ({rows.length})
      </Button>
    </DeleteDialog>
  )
}
