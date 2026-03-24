"use client"

import type { Table } from "@tanstack/react-table"
import { TrashIcon } from "lucide-react"
import { DeleteDialog } from "~/components/admin/dialogs/delete-dialog"
import { Button } from "~/components/common/button"
import { orpc } from "~/lib/orpc-query"
import type { CertificationListRow } from "~/server/admin/certifications/schema"

export function CertificationTableToolbarActions({ table }: { table: Table<CertificationListRow> }) {
  const { rows } = table.getFilteredSelectedRowModel()
  if (!rows.length) return null
  return (
    <DeleteDialog
      ids={rows.map(r => r.original.id)}
      label="certification"
      mutationOptions={orpc.admin.certifications.remove.mutationOptions}
      queryKey={orpc.admin.certifications.key()}
    >
      <Button variant="secondary" size="md" prefix={<TrashIcon />}>
        Delete ({rows.length})
      </Button>
    </DeleteDialog>
  )
}
