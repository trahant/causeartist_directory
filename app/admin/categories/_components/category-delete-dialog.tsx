"use client"

import { getHotkeyHandler } from "@mantine/hooks"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import plur from "plur"
import type { PropsWithChildren } from "react"
import { useMemo } from "react"
import { toast } from "sonner"
import type { Category } from "~/.generated/prisma/browser"
import { Button } from "~/components/common/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/common/dialog"
import { Kbd } from "~/components/common/kbd"
import { orpc } from "~/lib/orpc-query"

type CategoryDeleteDialogProps = PropsWithChildren<{
  categories: Category[]
  onExecute?: () => void
}>

export const CategoryDeleteDialog = ({
  categories,
  onExecute,
  children,
  ...props
}: CategoryDeleteDialogProps) => {
  const queryClient = useQueryClient()
  const ids = useMemo(() => categories.map(({ id }) => id), [categories])
  const pluralizedLabel = useMemo(() => plur("category", ids.length), [ids])

  const deleteMutation = useMutation(
    orpc.categories.remove.mutationOptions({
      onSuccess: () => {
        toast.success("Category(ies) deleted successfully")
        queryClient.invalidateQueries({ queryKey: orpc.categories.key() })
        onExecute?.()
      },

      onError: error => {
        toast.error(error.message)
      },
    }),
  )

  const handleKeyDown = getHotkeyHandler([
    [
      "mod+Enter",
      e => {
        e.stopPropagation()
        deleteMutation.mutate({ ids })
      },
    ],
  ])

  return (
    <Dialog {...props}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}

      <DialogContent className="max-w-md" onKeyDown={handleKeyDown}>
        <DialogHeader>
          <DialogTitle>Are you sure?</DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete{" "}
            <strong className="whitespace-nowrap">
              {ids.length} {pluralizedLabel}
            </strong>{" "}
            from the database.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <DialogClose asChild>
            <Button size="md" variant="secondary" suffix={<Kbd keys={["esc"]} />}>
              Cancel
            </Button>
          </DialogClose>

          <Button
            aria-label={`Delete ${pluralizedLabel}`}
            size="md"
            variant="destructive"
            className="min-w-28"
            onClick={() => deleteMutation.mutate({ ids })}
            suffix={<Kbd variant="outline" keys={["meta", "enter"]} />}
            isPending={deleteMutation.isPending}
          >
            Delete {pluralizedLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
