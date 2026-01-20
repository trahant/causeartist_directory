"use client"

import { CopyIcon, EllipsisIcon, TrashIcon } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { useAction } from "next-safe-action/hooks"
import type { ComponentProps } from "react"
import { toast } from "sonner"
import type { Tag } from "~/.generated/prisma/browser"
import { TagDeleteDialog } from "~/app/admin/tags/_components/tag-delete-dialog"
import { Button } from "~/components/common/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/common/dropdown-menu"
import { Link } from "~/components/common/link"
import { Stack } from "~/components/common/stack"
import { cx } from "~/lib/utils"
import { duplicateTag } from "~/server/admin/tags/actions"

type TagActionsProps = ComponentProps<typeof Button> & {
  tag: Tag
}

export const TagActions = ({ tag, className, ...props }: TagActionsProps) => {
  const pathname = usePathname()
  const router = useRouter()

  const indexPath = "/admin/tags"
  const singlePath = `${indexPath}/${tag.id}`
  const isSinglePage = pathname === singlePath

  const { executeAsync } = useAction(duplicateTag, {
    onSuccess: ({ data }) => {
      isSinglePage && router.push(`${indexPath}/${data.id}`)
    },
  })

  const handleDuplicate = () => {
    toast.promise(
      async () => {
        const { serverError } = await executeAsync({ id: tag.id })

        if (serverError) {
          throw new Error(serverError)
        }
      },
      {
        loading: "Duplicating tag...",
        success: "Tag duplicated successfully",
        error: err => `Failed to duplicate tag: ${err.message}`,
      },
    )
  }

  return (
    <Stack size="sm" wrap={false}>
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
            <Link href={`/tags/${tag.slug}`} target="_blank">
              View
            </Link>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem onSelect={handleDuplicate}>
            <CopyIcon />
            Duplicate
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <TagDeleteDialog tags={[tag]} onExecute={() => isSinglePage && router.push(indexPath)}>
        <Button
          variant="secondary"
          size="sm"
          prefix={<TrashIcon />}
          className="text-red-500"
          {...props}
        />
      </TagDeleteDialog>
    </Stack>
  )
}
