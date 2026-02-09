"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { BookmarkXIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { useAction } from "next-safe-action/hooks"
import { useRouter } from "next/navigation"
import { useQueryStates } from "nuqs"
import { useMemo } from "react"
import { toast } from "sonner"
import { Tool } from "~/.generated/prisma/browser"
import { Button } from "~/components/common/button"
import { Note } from "~/components/common/note"
import { DataTable } from "~/components/data-table/data-table"
import { DataTableColumnHeader } from "~/components/data-table/data-table-column-header"
import { DataTableLink } from "~/components/data-table/data-table-link"
import { DataTableToolbar } from "~/components/data-table/data-table-toolbar"
import { useDataTable } from "~/hooks/use-data-table"
import { findTools } from "~/server/admin/tools/queries"
import { toolListParams } from "~/server/admin/tools/schema"
import { removeBookmark } from "~/server/web/actions/bookmark"
import type { DataTableFilterField } from "~/types"

type BookmarkRemoveButtonProps = {
  toolId: string
}

const BookmarkRemoveButton = ({ toolId }: BookmarkRemoveButtonProps) => {
  const t = useTranslations("pages.dashboard.table")
  const router = useRouter()

  const { execute, isPending } = useAction(removeBookmark, {
    onSuccess: () => {
      toast.success(t("bookmarks.success_message"))
      router.refresh()
    },
  })

  return (
    <Button
      size="sm"
      variant="secondary"
      prefix={<BookmarkXIcon />}
      onClick={() => execute({ toolId })}
      isPending={isPending}
      className="float-right -my-1"
    >
      {t("bookmarks.remove_button")}
    </Button>
  )
}

export const BookmarkTable = ({ tools, pageCount }: Awaited<ReturnType<typeof findTools>>) => {
  const t = useTranslations("pages.dashboard.table")
  const [{ perPage, sort }] = useQueryStates(toolListParams)

  const columns = useMemo((): ColumnDef<Tool>[] => {
    return [
      {
        accessorKey: "name",
        size: 160,
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("columns.name")} />,
        cell: ({ row }) => {
          const { name, slug, faviconUrl } = row.original
          return <DataTableLink href={`/${slug}`} image={faviconUrl} title={name} />
        },
      },
      {
        accessorKey: "tagline",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("columns.tagline")} />
        ),
        cell: ({ row }) => <Note className="truncate">{row.original.tagline}</Note>,
      },
      {
        id: "actions",
        cell: ({ row }) => <BookmarkRemoveButton toolId={row.original.id} />,
      },
    ]
  }, [])

  const filterFields: DataTableFilterField<Tool>[] = [
    {
      id: "name",
      label: t("filters.name_label"),
      placeholder: t("filters.name_placeholder"),
    },
  ]

  const { table } = useDataTable({
    data: tools,
    columns,
    pageCount,
    filterFields,
    shallow: false,
    clearOnDefault: true,
    enableHiding: false,
    initialState: {
      pagination: { pageIndex: 0, pageSize: perPage },
      sorting: sort,
      columnPinning: { right: ["actions"] },
    },
    getRowId: row => row.slug,
  })

  return (
    <DataTable table={table} emptyState={t("bookmarks.empty_state")}>
      <DataTableToolbar table={table} filterFields={filterFields} />
    </DataTable>
  )
}
