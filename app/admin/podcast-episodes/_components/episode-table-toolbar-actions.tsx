"use client"

import type { Table } from "@tanstack/react-table"
import { TrashIcon } from "lucide-react"
import { DeleteDialog } from "~/components/admin/dialogs/delete-dialog"
import { Button } from "~/components/common/button"
import { orpc } from "~/lib/orpc-query"
import type { PodcastEpisodeListRow } from "~/server/admin/podcast-episodes/schema"

type Props = { table: Table<PodcastEpisodeListRow> }

export function EpisodeTableToolbarActions({ table }: Props) {
  const { rows } = table.getFilteredSelectedRowModel()
  if (!rows.length) return null

  return (
    <DeleteDialog
      ids={rows.map(r => r.original.id)}
      label="podcast episode"
      mutationOptions={orpc.admin.podcastEpisodes.remove.mutationOptions}
      queryKey={orpc.admin.podcastEpisodes.key()}
    >
      <Button variant="secondary" size="md" prefix={<TrashIcon />}>
        Delete ({rows.length})
      </Button>
    </DeleteDialog>
  )
}
