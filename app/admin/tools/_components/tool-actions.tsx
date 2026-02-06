"use client"

import { isValidUrl } from "@primoui/utils"
import { CopyIcon, EllipsisIcon, GlobeIcon, TrashIcon } from "lucide-react"
import { useAction } from "next-safe-action/hooks"
import { usePathname, useRouter } from "next/navigation"
import type { ComponentProps } from "react"
import { toast } from "sonner"
import type { Tool } from "~/.generated/prisma/browser"
import { ToolDeleteDialog } from "~/app/admin/tools/_components/tool-delete-dialog"
import { Button } from "~/components/common/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/common/dropdown-menu"
import { Link } from "~/components/common/link"
import { ButtonGroup } from "~/components/common/button-group"
import { ExternalLink } from "~/components/web/external-link"
import { cx } from "~/lib/utils"
import { duplicateTool } from "~/server/admin/tools/actions"

type ToolActionsProps = ComponentProps<typeof Button> & {
  tool: Tool
}

export const ToolActions = ({ className, tool, ...props }: ToolActionsProps) => {
  const pathname = usePathname()
  const router = useRouter()

  const indexPath = "/admin/tools"
  const singlePath = `${indexPath}/${tool.id}`
  const isSinglePage = pathname === singlePath

  const { executeAsync } = useAction(duplicateTool, {
    onSuccess: ({ data }) => {
      if (isSinglePage) {
        router.push(`${indexPath}/${data.id}`)
      }
    },
  })

  // TODO: Think about how to handle unique website URLs or remove this feature
  const handleDuplicate = () => {
    toast.promise(
      async () => {
        const { serverError } = await executeAsync({ id: tool.id })

        if (serverError) {
          throw new Error(serverError)
        }
      },
      {
        loading: "Duplicating tool...",
        success: "Tool duplicated successfully",
        error: err => `Failed to duplicate tool: ${err.message}`,
      },
    )
  }

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

          <DropdownMenuItem asChild>
            <Link href={`/${tool.slug}`} target="_blank">
              View
            </Link>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem onSelect={handleDuplicate}>
            <CopyIcon />
            Duplicate
          </DropdownMenuItem>

          {isValidUrl(tool.websiteUrl) && (
            <DropdownMenuItem asChild>
              <ExternalLink href={tool.websiteUrl} doTrack>
                <GlobeIcon />
                Visit website
              </ExternalLink>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <ToolDeleteDialog tools={[tool]} onExecute={() => isSinglePage && router.push(indexPath)}>
        <Button
          aria-label="Delete"
          variant="secondary"
          size="sm"
          prefix={<TrashIcon />}
          className="text-red-500"
          {...props}
        />
      </ToolDeleteDialog>
    </ButtonGroup>
  )
}
