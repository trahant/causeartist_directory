"use client"

import type { Table } from "@tanstack/react-table"
import { TrashIcon } from "lucide-react"
import { DeleteDialog } from "~/components/admin/dialogs/delete-dialog"
import { Button } from "~/components/common/button"
import { orpc } from "~/lib/orpc-query"
import type { BlogPostListRow } from "~/server/admin/blog-posts/schema"

type Props = { table: Table<BlogPostListRow> }

export function BlogPostTableToolbarActions({ table }: Props) {
  const { rows } = table.getFilteredSelectedRowModel()
  if (!rows.length) return null

  return (
    <DeleteDialog
      ids={rows.map(r => r.original.id)}
      label="blog post"
      mutationOptions={orpc.admin.blogPosts.remove.mutationOptions}
      queryKey={orpc.admin.blogPosts.key()}
    >
      <Button variant="secondary" size="md" prefix={<TrashIcon />}>
        Delete ({rows.length})
      </Button>
    </DeleteDialog>
  )
}
