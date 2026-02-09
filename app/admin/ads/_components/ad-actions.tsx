"use client"

import { isValidUrl } from "@primoui/utils"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { CopyIcon, EllipsisIcon, GlobeIcon, TrashIcon } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import type { ComponentProps } from "react"
import { toast } from "sonner"
import type { Ad } from "~/.generated/prisma/browser"
import { AdDeleteDialog } from "~/app/admin/ads/_components/ad-delete-dialog"
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
import { orpc } from "~/lib/orpc-query"
import { cx } from "~/lib/utils"

type AdActionsProps = ComponentProps<typeof Button> & {
  ad: Ad
}

export const AdActions = ({ ad, className, ...props }: AdActionsProps) => {
  const pathname = usePathname()
  const router = useRouter()
  const queryClient = useQueryClient()

  const indexPath = "/admin/ads"
  const singlePath = `${indexPath}/${ad.id}`
  const isSinglePage = pathname === singlePath

  const duplicateMutation = useMutation(
    orpc.ads.duplicate.mutationOptions({
      onSuccess: data => {
        queryClient.invalidateQueries({ queryKey: orpc.ads.key() })

        if (isSinglePage) {
          router.push(`${indexPath}/${data.id}`)
        }
      },
    }),
  )

  const handleDuplicate = () => {
    toast.promise(duplicateMutation.mutateAsync({ id: ad.id }), {
      loading: "Duplicating ad...",
      success: "Ad duplicated successfully",
      error: err => `Failed to duplicate ad: ${err.message}`,
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

          <DropdownMenuSeparator />

          <DropdownMenuItem onSelect={handleDuplicate}>
            <CopyIcon />
            Duplicate
          </DropdownMenuItem>

          {isValidUrl(ad.websiteUrl) && (
            <DropdownMenuItem asChild>
              <ExternalLink href={ad.websiteUrl} doTrack>
                <GlobeIcon />
                Visit website
              </ExternalLink>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AdDeleteDialog ads={[ad]} onExecute={() => isSinglePage && router.push(indexPath)}>
        <Button
          aria-label="Delete"
          variant="secondary"
          size="sm"
          prefix={<TrashIcon />}
          className="text-red-500"
          {...props}
        />
      </AdDeleteDialog>
    </ButtonGroup>
  )
}
