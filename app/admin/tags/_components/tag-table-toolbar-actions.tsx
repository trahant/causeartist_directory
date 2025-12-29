"use client"

import type { Table } from "@tanstack/react-table"
import { TrashIcon } from "lucide-react"
import type { Tag } from "~/.generated/prisma/browser"
import { TagDeleteDialog } from "~/app/admin/tags/_components/tag-delete-dialog"
import { Button } from "~/components/common/button"

interface TagTableToolbarActionsProps {
  table: Table<Tag>
}

export const TagTableToolbarActions = ({ table }: TagTableToolbarActionsProps) => {
  const { rows } = table.getFilteredSelectedRowModel()

  if (!rows.length) {
    return null
  }

  return (
    <TagDeleteDialog tags={rows.map(row => row.original)}>
      <Button variant="secondary" size="md" prefix={<TrashIcon />}>
        Delete ({rows.length})
      </Button>
    </TagDeleteDialog>
  )
}
