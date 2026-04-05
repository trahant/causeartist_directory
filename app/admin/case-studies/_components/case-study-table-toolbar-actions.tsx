"use client"

import type { Table } from "@tanstack/react-table"
import { TrashIcon } from "lucide-react"
import { DeleteDialog } from "~/components/admin/dialogs/delete-dialog"
import { Button } from "~/components/common/button"
import { orpc } from "~/lib/orpc-query"
import type { CaseStudyListRow } from "~/server/admin/case-studies/schema"

type Props = { table: Table<CaseStudyListRow> }

export function CaseStudyTableToolbarActions({ table }: Props) {
  const { rows } = table.getFilteredSelectedRowModel()
  if (!rows.length) return null

  return (
    <DeleteDialog
      ids={rows.map(r => r.original.id)}
      label="case study"
      mutationOptions={orpc.admin.caseStudies.remove.mutationOptions}
      queryKey={orpc.admin.caseStudies.key()}
    >
      <Button variant="secondary" size="md" prefix={<TrashIcon />}>
        Delete ({rows.length})
      </Button>
    </DeleteDialog>
  )
}
