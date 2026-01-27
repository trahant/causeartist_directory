"use client"

import { formatDate } from "@primoui/utils"
import type { ColumnDef } from "@tanstack/react-table"
import {
  ArrowUpRightIcon,
  CircleCheckIcon,
  CircleDashedIcon,
  CircleDotDashedIcon,
  CircleDotIcon,
  PlusIcon,
} from "lucide-react"
import { useFormatter, useTranslations } from "next-intl"
import { useQueryStates } from "nuqs"
import { Slot } from "radix-ui"
import { useMemo } from "react"
import { type Tool, ToolStatus } from "~/.generated/prisma/browser"
import { Button } from "~/components/common/button"
import { Link } from "~/components/common/link"
import { Note } from "~/components/common/note"
import { Stack } from "~/components/common/stack"
import { DataTable } from "~/components/data-table/data-table"
import { DataTableColumnHeader } from "~/components/data-table/data-table-column-header"
import { DataTableLink } from "~/components/data-table/data-table-link"
import { DataTableToolbar } from "~/components/data-table/data-table-toolbar"
import { LogoSymbol } from "~/components/web/ui/logo-symbol"
import { useDataTable } from "~/hooks/use-data-table"
import { isToolPremiumTier } from "~/lib/tools"
import type { findTools } from "~/server/admin/tools/queries"
import { toolTableParamsSchema } from "~/server/admin/tools/schema"
import type { DataTableFilterField } from "~/types"

export const DashboardTable = ({ tools, pageCount }: Awaited<ReturnType<typeof findTools>>) => {
  const t = useTranslations("pages.dashboard.table")
  const format = useFormatter()
  const [{ perPage, sort }] = useQueryStates(toolTableParamsSchema)

  // Memoize the columns so they don't re-render on every render
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
        accessorKey: "createdAt",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("columns.created_at")} />
        ),
        cell: ({ row }) => <Note>{formatDate(row.getValue<Date>("createdAt"))}</Note>,
      },
      {
        accessorKey: "publishedAt",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("columns.published_at")} />
        ),
        cell: ({ row }) => {
          const { status, publishedAt } = row.original

          const statusIcons = {
            [ToolStatus.Published]: {
              label: format.dateTime(publishedAt!, { dateStyle: "medium" }),
              icon: <CircleCheckIcon className="text-green-500" />,
            },
            [ToolStatus.Scheduled]: {
              label: `${format.dateTime(publishedAt!, { dateStyle: "medium" })} (${t("status.scheduled")})`,
              icon: <CircleDotIcon className="text-blue-500" />,
            },
            [ToolStatus.Pending]: {
              label: t("status.pending"),
              icon: <CircleDotDashedIcon className="text-yellow-500" />,
            },
            [ToolStatus.Draft]: {
              label: t("status.draft"),
              icon: <CircleDashedIcon className="text-gray-500" />,
            },
          }

          return (
            <Stack size="sm" wrap={false}>
              <Slot.Root className="-mr-0.5 stroke-[2.5]" aria-hidden="true">
                {statusIcons[status].icon}
              </Slot.Root>

              <Note className="font-medium">{statusIcons[status].label}</Note>
            </Stack>
          )
        },
      },
      {
        id: "actions",
        cell: ({ row }) => {
          if (isToolPremiumTier(row.original)) {
            return null
          }

          return (
            <Button
              size="sm"
              variant="secondary"
              prefix={<LogoSymbol className="text-primary" />}
              suffix={<ArrowUpRightIcon />}
              className="float-right -my-1"
              asChild
            >
              <Link href={`/submit/${row.original.slug}`}>{t("upgrade_button")}</Link>
            </Button>
          )
        },
      },
    ]
  }, [])

  // Search filters
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
    getRowId: originalRow => originalRow.slug,
  })

  return (
    <DataTable table={table} emptyState={t("empty_state")}>
      <DataTableToolbar table={table} filterFields={filterFields}>
        <Button size="md" variant="primary" prefix={<PlusIcon />} asChild>
          <Link href="/submit">{t("submit_button")}</Link>
        </Button>
      </DataTableToolbar>
    </DataTable>
  )
}
