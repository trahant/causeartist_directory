"use client"

import type { Table } from "@tanstack/react-table"
import { TrashIcon } from "lucide-react"
import type { Category } from "~/.generated/prisma/browser"
import { CategoryDeleteDialog } from "~/app/admin/categories/_components/category-delete-dialog"
import { Button } from "~/components/common/button"

interface CategoryTableToolbarActionsProps {
  table: Table<Category>
}

export function CategoryTableToolbarActions({ table }: CategoryTableToolbarActionsProps) {
  const { rows } = table.getFilteredSelectedRowModel()

  if (!rows.length) {
    return null
  }

  return (
    <CategoryDeleteDialog categories={rows.map(row => row.original)}>
      <Button variant="secondary" size="md" prefix={<TrashIcon />}>
        Delete ({rows.length})
      </Button>
    </CategoryDeleteDialog>
  )
}
