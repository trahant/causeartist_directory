"use client"

import { getHotkeyHandler } from "@mantine/hooks"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import plur from "plur"
import type { PropsWithChildren } from "react"
import { useMemo } from "react"
import { toast } from "sonner"
import type { Tool } from "~/.generated/prisma/browser"
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

type ToolDeleteDialogProps = PropsWithChildren<{
  tools: Tool[]
  onExecute?: () => void
}>

export const ToolDeleteDialog = ({ tools, onExecute, children, ...props }: ToolDeleteDialogProps) => {
  const queryClient = useQueryClient()
  const ids = useMemo(() => tools.map(({ id }) => id), [tools])
  const pluralizedLabel = useMemo(() => plur("tool", ids.length), [ids])

  const deleteMutation = useMutation(
    orpc.tools.remove.mutationOptions({
      onSuccess: () => {
        toast.success("Tool(s) deleted successfully")
        queryClient.invalidateQueries({ queryKey: orpc.tools.key() })
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
