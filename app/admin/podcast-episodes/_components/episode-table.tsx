"use client"

import { formatDate } from "@primoui/utils"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import type { ColumnDef } from "@tanstack/react-table"
import { ExternalLinkIcon, PlusIcon } from "lucide-react"
import { useQueryStates } from "nuqs"
import { EpisodeTableToolbarActions } from "~/app/admin/podcast-episodes/_components/episode-table-toolbar-actions"
import { RowCheckbox } from "~/components/admin/row-checkbox"
import { Badge } from "~/components/common/badge"
import { Button } from "~/components/common/button"
import { Link } from "~/components/common/link"
import { Note } from "~/components/common/note"
import { DataTable } from "~/components/data-table/data-table"
import { DataTableColumnHeader } from "~/components/data-table/data-table-column-header"
import { DataTableHeader } from "~/components/data-table/data-table-header"
import { DataTableLink } from "~/components/data-table/data-table-link"
import { DataTableToolbar } from "~/components/data-table/data-table-toolbar"
import { DataTableViewOptions } from "~/components/data-table/data-table-view-options"
import { useDataTable } from "~/hooks/use-data-table"
import { episodeProfileHref } from "~/lib/podcast-links"
import { orpc } from "~/lib/orpc-query"
import { isDefaultState } from "~/lib/parsers"
import { podcastEpisodeListParams } from "~/server/admin/podcast-episodes/schema"
import type { PodcastEpisodeListRow } from "~/server/admin/podcast-episodes/schema"
import type { DataTableFilterField } from "~/types"

function episodeShowLabel(show: string | null) {
  if (show === "dfg") return "Disruptors for Good"
  if (show === "iip") return "Investing in Impact"
  return "Generic"
}

const columns: ColumnDef<PodcastEpisodeListRow>[] = [
  {
    id: "select",
    enableSorting: false,
    enableHiding: false,
    header: ({ table }) => (
      <RowCheckbox
        checked={table.getIsAllPageRowsSelected()}
        ref={input => {
          if (input) {
            input.indeterminate =
              table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected()
          }
        }}
        onChange={e => table.toggleAllPageRowsSelected(e.target.checked)}
        aria-label="Select all"
      />
    ),
    cell: ({ row, table }) => (
      <RowCheckbox
        checked={row.getIsSelected()}
        onChange={e => row.toggleSelected(e.target.checked)}
        aria-label="Select row"
        table={table}
        row={row}
      />
    ),
  },
  {
    accessorKey: "title",
    enableHiding: false,
    size: 220,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Title" />,
    cell: ({ row }) => (
      <DataTableLink href={`/admin/podcast-episodes/${row.original.id}`} title={row.original.title} />
    ),
  },
  {
    accessorKey: "show",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Show" />,
    cell: ({ row }) => <Note>{episodeShowLabel(row.original.show)}</Note>,
  },
  {
    accessorKey: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => (
      <Badge variant={row.original.status === "published" ? "success" : "soft"}>
        {row.original.status}
      </Badge>
    ),
  },
  {
    accessorKey: "publishedAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Published" />,
    cell: ({ row }) => {
      const d = row.original.publishedAt
      return <Note>{d ? formatDate(d) : "—"}</Note>
    },
  },
  {
    id: "public",
    enableSorting: false,
    size: 48,
    header: () => null,
    cell: ({ row }) =>
      row.original.status === "published" ? (
        <Button variant="ghost" size="sm" className="size-8 p-0" asChild>
          <Link
            href={episodeProfileHref({ show: row.original.show, slug: row.original.slug })}
            target="_blank"
            rel="noreferrer"
          >
            <ExternalLinkIcon className="size-4" />
            <span className="sr-only">View on site</span>
          </Link>
        </Button>
      ) : null,
  },
]

export function EpisodeTable() {
  const [params, setParams] = useQueryStates(podcastEpisodeListParams)

  const { data, isLoading, isFetching } = useQuery(
    orpc.admin.podcastEpisodes.list.queryOptions({
      input: params,
      placeholderData: keepPreviousData,
    }),
  )

  const filterFields: DataTableFilterField<PodcastEpisodeListRow>[] = [
    { id: "title", label: "Search", placeholder: "Title or slug…" },
  ]

  const { table } = useDataTable({
    data: data?.podcastEpisodes ?? [],
    columns,
    pageCount: data?.pageCount ?? 0,
    filterFields,
    clearOnDefault: true,
    initialState: {
      pagination: { pageIndex: 0, pageSize: params.perPage },
      sorting: params.sort,
      columnPinning: { right: ["public"] },
    },
    getRowId: (originalRow, index) => `${originalRow.id}-${index}`,
  })

  return (
    <DataTable table={table} isLoading={isLoading} isFetching={isFetching && !isLoading}>
      <DataTableHeader
        title="Podcast episodes"
        total={data?.podcastEpisodesTotal}
        callToAction={
          <Button variant="primary" size="md" prefix={<PlusIcon />} asChild>
            <Link href="/admin/podcast-episodes/new">
              <div className="max-sm:sr-only">New episode</div>
            </Link>
          </Button>
        }
      >
        <DataTableToolbar
          table={table}
          filterFields={filterFields}
          isFiltered={!isDefaultState(podcastEpisodeListParams, params, ["perPage", "page"])}
          onReset={() => {
            table.resetColumnFilters()
            void setParams(null)
          }}
        >
          <EpisodeTableToolbarActions table={table} />
          <DataTableViewOptions table={table} />
        </DataTableToolbar>
      </DataTableHeader>
    </DataTable>
  )
}
