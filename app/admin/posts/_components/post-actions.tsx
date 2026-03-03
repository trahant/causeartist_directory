"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { CopyIcon, EllipsisIcon, TrashIcon } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import type { ComponentProps } from "react"
import { toast } from "sonner"
import type { Post } from "~/.generated/prisma/browser"
import { DeleteDialog } from "~/components/admin/dialogs/delete-dialog"
import { Button } from "~/components/common/button"
import { ButtonGroup } from "~/components/common/button-group"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/common/dropdown-menu"
import { Link } from "~/components/common/link"
import { orpc } from "~/lib/orpc-query"
import { cx } from "~/lib/utils"

type PostActionsProps = ComponentProps<typeof Button> & {
  post: Post
}

export const PostActions = ({ className, post, ...props }: PostActionsProps) => {
  const pathname = usePathname()
  const router = useRouter()
  const queryClient = useQueryClient()

  const indexPath = "/admin/posts"
  const singlePath = `${indexPath}/${post.id}`
  const isSinglePage = pathname === singlePath

  const duplicateMutation = useMutation(
    orpc.posts.duplicate.mutationOptions({
      onSuccess: data => {
        queryClient.invalidateQueries({ queryKey: orpc.posts.key() })

        if (isSinglePage) {
          router.push(`${indexPath}/${data.id}`)
        }
      },
    }),
  )

  const handleDuplicate = () => {
    toast.promise(duplicateMutation.mutateAsync({ id: post.id }), {
      loading: "Duplicating post...",
      success: "Post duplicated successfully",
      error: err => `Failed to duplicate post: ${err.message}`,
    })
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
            <Link href={`/blog/${post.slug}`} target="_blank">
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

      <DeleteDialog
        ids={[post.id]}
        label="post"
        mutationOptions={orpc.posts.remove.mutationOptions}
        queryKey={orpc.posts.key()}
        onExecute={() => isSinglePage && router.push(indexPath)}
      >
        <Button
          aria-label="Delete"
          variant="secondary"
          size="sm"
          prefix={<TrashIcon />}
          className="text-red-500"
          {...props}
        />
      </DeleteDialog>
    </ButtonGroup>
  )
}
