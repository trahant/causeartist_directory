"use client"

import { keepPreviousData, useQuery } from "@tanstack/react-query"
import type { ColumnDef } from "@tanstack/react-table"
import { ExternalLinkIcon, PlusIcon } from "lucide-react"
import { useQueryStates } from "nuqs"
import { GlossaryTableToolbarActions } from "~/app/admin/glossary/_components/glossary-table-toolbar-actions"
import { RowCheckbox } from "~/components/admin/row-checkbox"
import { Badge } from "~/components/common/badge"
import { Button } from "~/components/common/button"
import { Link } from "~/components/common/link"
import { DataTable } from "~/components/data-table/data-table"
import { DataTableColumnHeader } from "~/components/data-table/data-table-column-header"
import { DataTableHeader } from "~/components/data-table/data-table-header"
import { DataTableLink } from "~/components/data-table/data-table-link"
import { DataTableToolbar } from "~/components/data-table/data-table-toolbar"
import { DataTableViewOptions } from "~/components/data-table/data-table-view-options"
import { useDataTable } from "~/hooks/use-data-table"
import { orpc } from "~/lib/orpc-query"
import { isDefaultState } from "~/lib/parsers"
import { glossaryTermListParams } from "~/server/admin/glossary-terms/schema"
import type { GlossaryTermListRow } from "~/server/admin/glossary-terms/schema"
import type { DataTableFilterField } from "~/types"

const columns: ColumnDef<GlossaryTermListRow>[] = [
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
    accessorKey: "term",
    enableHiding: false,
    size: 280,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Term" />,
    cell: ({ row }) => (
      <DataTableLink href={`/admin/glossary/${row.original.id}`} title={row.original.term} />
    ),
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
    id: "public",
    enableSorting: false,
    size: 48,
    header: () => null,
    cell: ({ row }) =>
      row.original.status === "published" ? (
        <Button variant="ghost" size="sm" className="size-8 p-0" asChild>
          <Link href={`/glossary/${row.original.slug}`} target="_blank" rel="noreferrer">
            <ExternalLinkIcon className="size-4" />
            <span className="sr-only">View on site</span>
          </Link>
        </Button>
      ) : null,
  },
]

export function GlossaryTable() {
  const [params, setParams] = useQueryStates(glossaryTermListParams)

  const { data, isLoading, isFetching } = useQuery(
    orpc.admin.glossaryTerms.list.queryOptions({
      input: params,
      placeholderData: keepPreviousData,
    }),
  )

  const filterFields: DataTableFilterField<GlossaryTermListRow>[] = [
    { id: "term", label: "Search", placeholder: "Term or slug…" },
  ]

  const { table } = useDataTable({
    data: data?.glossaryTerms ?? [],
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
        title="Glossary"
        total={data?.glossaryTermsTotal}
        callToAction={
          <Button variant="primary" size="md" prefix={<PlusIcon />} asChild>
            <Link href="/admin/glossary/new">
              <div className="max-sm:sr-only">New term</div>
            </Link>
          </Button>
        }
      >
        <DataTableToolbar
          table={table}
          filterFields={filterFields}
          isFiltered={!isDefaultState(glossaryTermListParams, params, ["perPage", "page"])}
          onReset={() => {
            table.resetColumnFilters()
            void setParams(null)
          }}
        >
          <GlossaryTableToolbarActions table={table} />
          <DataTableViewOptions table={table} />
        </DataTableToolbar>
      </DataTableHeader>
    </DataTable>
  )
}
