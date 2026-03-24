"use client"

import type { Table } from "@tanstack/react-table"
import { TrashIcon } from "lucide-react"
import { DeleteDialog } from "~/components/admin/dialogs/delete-dialog"
import { Button } from "~/components/common/button"
import { orpc } from "~/lib/orpc-query"
import type { AuthorListRow } from "~/server/admin/authors/schema"

export function AuthorTableToolbarActions({ table }: { table: Table<AuthorListRow> }) {
  const { rows } = table.getFilteredSelectedRowModel()
  if (!rows.length) return null
  return (
    <DeleteDialog
      ids={rows.map(r => r.original.id)}
      label="author"
      mutationOptions={orpc.admin.authors.remove.mutationOptions}
      queryKey={orpc.admin.authors.key()}
    >
      <Button variant="secondary" size="md" prefix={<TrashIcon />}>
        Delete ({rows.length})
      </Button>
    </DeleteDialog>
  )
}
