"use client"

import { formatDate } from "@primoui/utils"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import type { ColumnDef } from "@tanstack/react-table"
import { CircleCheckIcon, CircleDashedIcon, CircleDotIcon, PlusIcon } from "lucide-react"
import { useQueryStates } from "nuqs"
import type { ComponentProps } from "react"
import type { Post } from "~/.generated/prisma/browser"
import { PostStatus } from "~/.generated/prisma/browser"
import { PostActions } from "~/app/admin/posts/_components/post-actions"
import { PostTableToolbarActions } from "~/app/admin/posts/_components/post-table-toolbar-actions"
import { DateRangePicker } from "~/components/admin/date-range-picker"
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
import { orpc } from "~/lib/orpc-query"
import { isDefaultState } from "~/lib/parsers"
import { postListParams } from "~/server/admin/posts/schema"
import type { DataTableFilterField } from "~/types"

const statusBadges: Record<PostStatus, ComponentProps<typeof Badge>> = {
  [PostStatus.Draft]: {
    variant: "soft",
  },
  [PostStatus.Scheduled]: {
    variant: "info",
  },
  [PostStatus.Published]: {
    variant: "success",
  },
}

type PostWithAuthor = Post & {
  author: { id: string; name: string }
}

const columns: ColumnDef<PostWithAuthor>[] = [
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
    size: 240,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Title" />,
    cell: ({ row }) => {
      const { id, title } = row.original
      return <DataTableLink href={`/admin/posts/${id}`} title={title} />
    },
  },
  {
    accessorKey: "author",
    enableSorting: false,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Author" />,
    cell: ({ row }) => <Note>{row.original.author?.name}</Note>,
  },
  {
    accessorKey: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => <Badge {...statusBadges[row.original.status]}>{row.original.status}</Badge>,
  },
  {
    accessorKey: "publishedAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Published At" />,
    cell: ({ row }) =>
      row.original.publishedAt ? (
        <Note>{formatDate(row.getValue<Date>("publishedAt"))}</Note>
      ) : (
        <Note>—</Note>
      ),
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Created At" />,
    cell: ({ row }) => <Note>{formatDate(row.getValue<Date>("createdAt"))}</Note>,
  },
  {
    id: "actions",
    cell: ({ row }) => <PostActions post={row.original} className="float-right" />,
  },
]

export const PostTable = () => {
  const [params, setParams] = useQueryStates(postListParams)

  const { data, isLoading, isFetching } = useQuery(
    orpc.admin.posts.list.queryOptions({
      input: params,
      placeholderData: keepPreviousData,
    }),
  )

  // Search filters
  const filterFields: DataTableFilterField<PostWithAuthor>[] = [
    {
      id: "title",
      label: "Title",
      placeholder: "Search by title...",
    },
    {
      id: "status",
      label: "Status",
      options: [
        {
          label: "Published",
          value: PostStatus.Published,
          icon: <CircleCheckIcon className="text-green-500" />,
        },
        {
          label: "Scheduled",
          value: PostStatus.Scheduled,
          icon: <CircleDotIcon className="text-blue-500" />,
        },
        {
          label: "Draft",
          value: PostStatus.Draft,
          icon: <CircleDashedIcon className="text-gray-500" />,
        },
      ],
    },
  ]

  const { table } = useDataTable({
    data: data?.posts ?? [],
    columns,
    pageCount: data?.pageCount ?? 0,
    filterFields,
    clearOnDefault: true,
    initialState: {
      pagination: { pageIndex: 0, pageSize: params.perPage },
      sorting: params.sort,
      columnVisibility: { createdAt: false },
      columnPinning: { right: ["actions"] },
    },
    getRowId: originalRow => originalRow.id,
  })

  return (
    <DataTable table={table} isLoading={isLoading} isFetching={isFetching && !isLoading}>
      <DataTableHeader
        title="Blog Posts"
        total={data?.postsTotal}
        callToAction={
          <Button variant="primary" size="md" prefix={<PlusIcon />} asChild>
            <Link href="/admin/posts/new">
              <div className="max-sm:sr-only">New post</div>
            </Link>
          </Button>
        }
      >
        <DataTableToolbar
          table={table}
          filterFields={filterFields}
          isFiltered={!isDefaultState(postListParams, params, ["perPage", "page"])}
          onReset={() => {
            table.resetColumnFilters()
            void setParams(null)
          }}
        >
          <PostTableToolbarActions table={table} />
          <DateRangePicker align="end" />
          <DataTableViewOptions table={table} />
        </DataTableToolbar>
      </DataTableHeader>
    </DataTable>
  )
}
