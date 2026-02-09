"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { CopyIcon, EllipsisIcon, TrashIcon } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import type { ComponentProps } from "react"
import { toast } from "sonner"
import type { Category } from "~/.generated/prisma/browser"
import { DeleteDialog } from "~/components/admin/dialogs/delete-dialog"
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
import { orpc } from "~/lib/orpc-query"
import { cx } from "~/lib/utils"

type CategoryActionsProps = ComponentProps<typeof Button> & {
  category: Category
}

export const CategoryActions = ({ category, className, ...props }: CategoryActionsProps) => {
  const pathname = usePathname()
  const router = useRouter()
  const queryClient = useQueryClient()

  const indexPath = "/admin/categories"
  const singlePath = `${indexPath}/${category.id}`
  const isSinglePage = pathname === singlePath

  const duplicateMutation = useMutation(
    orpc.categories.duplicate.mutationOptions({
      onSuccess: data => {
        queryClient.invalidateQueries({ queryKey: orpc.categories.key() })

        if (isSinglePage) {
          router.push(`${indexPath}/${data.id}`)
        }
      },
    }),
  )

  const handleDuplicate = () => {
    toast.promise(duplicateMutation.mutateAsync({ id: category.id }), {
      loading: "Duplicating category...",
      success: "Category duplicated successfully",
      error: err => `Failed to duplicate category: ${err.message}`,
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
            <Link href={`/categories/${category.slug}`} target="_blank">
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
        ids={[category.id]}
        label="category"
        mutationOptions={orpc.categories.remove.mutationOptions}
        queryKey={orpc.categories.key()}
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
