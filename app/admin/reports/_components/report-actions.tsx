"use client"

import { EllipsisIcon, TrashIcon } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import type { ComponentProps } from "react"
import type { Report } from "~/.generated/prisma/browser"
import { ReportDeleteDialog } from "~/app/admin/reports/_components/report-delete-dialog"
import { Button } from "~/components/common/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/common/dropdown-menu"
import { Link } from "~/components/common/link"
import { ButtonGroup } from "~/components/common/button-group"
import { cx } from "~/lib/utils"

type ReportActionsProps = ComponentProps<typeof Button> & {
  report: Report
}

export const ReportActions = ({ report, className, ...props }: ReportActionsProps) => {
  const pathname = usePathname()
  const router = useRouter()

  const indexPath = "/admin/reports"
  const singlePath = `${indexPath}/${report.id}`
  const isSinglePage = pathname === singlePath

  return (
    <ButtonGroup>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            aria-label="Open menu"
            variant="secondary"
            size="sm"
            prefix={<EllipsisIcon />}
            className={cx("data-[state=open]:bg-accent", className)}
            {...props}
          />
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" sideOffset={8}>
          {!isSinglePage && (
            <DropdownMenuItem asChild>
              <Link href={singlePath}>Edit</Link>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <ReportDeleteDialog
        reports={[report]}
        onExecute={() => isSinglePage && router.push(indexPath)}
      >
        <Button
          variant="secondary"
          size="sm"
          prefix={<TrashIcon />}
          className="text-red-500"
          {...props}
        />
      </ReportDeleteDialog>
    </ButtonGroup>
  )
}
