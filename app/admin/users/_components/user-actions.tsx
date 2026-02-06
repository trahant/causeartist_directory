"use client"

import { EllipsisIcon, TrashIcon } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { type ComponentProps, useTransition } from "react"
import { toast } from "sonner"
import type { User } from "~/.generated/prisma/browser"
import { UserDeleteDialog } from "~/app/admin/users/_components/user-delete-dialog"
import { Button } from "~/components/common/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "~/components/common/dropdown-menu"
import { Link } from "~/components/common/link"
import { ButtonGroup } from "~/components/common/button-group"
import { admin, useSession } from "~/lib/auth-client"
import { cx } from "~/lib/utils"
import { updateUserRole } from "~/server/admin/users/actions"

type UserActionsProps = ComponentProps<typeof Button> & {
  user: User
}

export const UserActions = ({ user, className, ...props }: UserActionsProps) => {
  const { data: session } = useSession()
  const pathname = usePathname()
  const router = useRouter()
  const [isUpdatePending, startUpdateTransition] = useTransition()
  const roles = ["admin", "user"] as const

  const indexPath = "/admin/users"
  const singlePath = `${indexPath}/${user.id}`
  const isSinglePage = pathname === singlePath

  if (user.id === session?.user.id) {
    return null
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

          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Role</DropdownMenuSubTrigger>

            <DropdownMenuSubContent>
              <DropdownMenuRadioGroup
                value={user.role}
                onValueChange={value => {
                  startUpdateTransition(() => {
                    toast.promise(
                      async () => {
                        await updateUserRole({
                          id: user.id,
                          role: value as (typeof roles)[number],
                        })

                        router.refresh()
                      },
                      { loading: "Updating...", success: "Role successfully updated" },
                    )
                  })
                }}
              >
                {roles.map(role => (
                  <DropdownMenuRadioItem
                    key={role}
                    value={role}
                    className="capitalize"
                    disabled={isUpdatePending}
                  >
                    {role}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuSeparator />

          {user.role !== "admin" &&
            (user.banned ? (
              <DropdownMenuItem
                onSelect={() => {
                  toast.promise(
                    async () => {
                      await admin.unbanUser({ userId: user.id })
                      router.refresh()
                    },
                    { loading: "Unbanning...", success: "User successfully unbanned" },
                  )
                }}
              >
                Unban
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                onSelect={() => {
                  toast.promise(
                    async () => {
                      await admin.banUser({ userId: user.id })
                      router.refresh()
                    },
                    { loading: "Banning...", success: "User successfully banned" },
                  )
                }}
              >
                Ban
              </DropdownMenuItem>
            ))}

          <DropdownMenuItem
            onSelect={() => {
              toast.promise(admin.revokeUserSessions({ userId: user.id }), {
                loading: "Revoking sessions...",
                success: "Sessions successfully revoked",
              })
            }}
          >
            Revoke Sessions
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {user.role !== "admin" && (
        <UserDeleteDialog users={[user]} onExecute={() => isSinglePage && router.push(indexPath)}>
          <Button
            variant="secondary"
            size="sm"
            prefix={<TrashIcon />}
            className="text-red-500"
            {...props}
          />
        </UserDeleteDialog>
      )}
    </ButtonGroup>
  )
}
