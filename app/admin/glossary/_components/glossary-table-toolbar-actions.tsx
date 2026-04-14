"use client"

import type { Table } from "@tanstack/react-table"
import { TrashIcon } from "lucide-react"
import { DeleteDialog } from "~/components/admin/dialogs/delete-dialog"
import { Button } from "~/components/common/button"
import { orpc } from "~/lib/orpc-query"
import type { GlossaryTermListRow } from "~/server/admin/glossary-terms/schema"

type Props = { table: Table<GlossaryTermListRow> }

export function GlossaryTableToolbarActions({ table }: Props) {
  const { rows } = table.getFilteredSelectedRowModel()
  if (!rows.length) return null

  return (
    <DeleteDialog
      ids={rows.map(r => r.original.id)}
      label="glossary term"
      mutationOptions={orpc.admin.glossaryTerms.remove.mutationOptions}
      queryKey={orpc.admin.glossaryTerms.key()}
    >
      <Button variant="secondary" size="md" prefix={<TrashIcon />}>
        Delete ({rows.length})
      </Button>
    </DeleteDialog>
  )
}
