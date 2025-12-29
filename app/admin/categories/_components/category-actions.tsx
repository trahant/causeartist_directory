"use client"

import { CopyIcon, EllipsisIcon, TrashIcon } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { useAction } from "next-safe-action/hooks"
import type { ComponentProps } from "react"
import { toast } from "sonner"
import type { Category } from "~/.generated/prisma/browser"
import { CategoryDeleteDialog } from "~/app/admin/categories/_components/category-delete-dialog"
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
import { duplicateCategory } from "~/server/admin/categories/actions"

type CategoryActionsProps = ComponentProps<typeof Button> & {
  category: Category
}

export const CategoryActions = ({ category, className, ...props }: CategoryActionsProps) => {
  const pathname = usePathname()
  const router = useRouter()

  const indexPath = "/admin/categories"
  const singlePath = `${indexPath}/${category.slug}`
  const isSinglePage = pathname === singlePath

  const { executeAsync } = useAction(duplicateCategory, {
    onSuccess: ({ data }) => {
      isSinglePage && router.push(`${indexPath}/${data.slug}`)
    },
  })

  const handleDuplicate = () => {
    toast.promise(
      async () => {
        const { serverError } = await executeAsync({ id: category.id })

        if (serverError) {
          throw new Error(serverError)
        }
      },
      {
        loading: "Duplicating category...",
        success: "Category duplicated successfully",
        error: err => `Failed to duplicate category: ${err.message}`,
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

      <CategoryDeleteDialog
        categories={[category]}
        onExecute={() => isSinglePage && router.push(indexPath)}
      >
        <Button
          variant="secondary"
          size="sm"
          prefix={<TrashIcon />}
          className="text-red-500"
          {...props}
        />
      </CategoryDeleteDialog>
    </Stack>
  )
}
