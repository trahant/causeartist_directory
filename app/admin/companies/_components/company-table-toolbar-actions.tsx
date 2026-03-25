"use client"

import type { Table } from "@tanstack/react-table"
import { TrashIcon } from "lucide-react"
import { DeleteDialog } from "~/components/admin/dialogs/delete-dialog"
import { Button } from "~/components/common/button"
import { orpc } from "~/lib/orpc-query"
import type { CompanyListRow } from "~/server/admin/companies/schema"

export function CompanyTableToolbarActions({ table }: { table: Table<CompanyListRow> }) {
  const { rows } = table.getFilteredSelectedRowModel()
  if (!rows.length) return null
  return (
    <DeleteDialog
      ids={rows.map(r => r.original.id)}
      label="company"
      mutationOptions={orpc.admin.companies.remove.mutationOptions}
      queryKey={orpc.admin.companies.key()}
    >
      <Button variant="secondary" size="md" prefix={<TrashIcon />}>
        Delete ({rows.length})
      </Button>
    </DeleteDialog>
  )
}
