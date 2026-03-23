import { getInitials } from "@primoui/utils"
import { BookmarkIcon, LogOutIcon, ShieldHalfIcon, UserIcon } from "lucide-react"
import { motion } from "motion/react"
import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { Avatar, AvatarFallback, AvatarImage } from "~/components/common/avatar"
import { Box, boxVariants } from "~/components/common/box"
import { Button, buttonVariants } from "~/components/common/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/common/dropdown-menu"
import { Link } from "~/components/common/link"
import { NavLink } from "~/components/web/ui/nav-link"
import { UserLogout } from "~/components/web/user-logout"
import { useSession } from "~/lib/auth-client"
import { cx } from "~/lib/utils"

export const UserMenu = () => {
  const { data: session } = useSession()
  const t = useTranslations()

  const [mounted, setMounted] = useState(false)

  // Ensure SSR + initial client render match (avoids hydration mismatch).
  useEffect(() => setMounted(true), [])

  // Only gate on mount — do not wait on session `isPending` (slow/hanging fetch left a disabled button forever).
  if (!mounted) {
    return (
      <Button size="sm" variant="secondary" disabled>
        {t("navigation.sign_in")}
      </Button>
    )
  }

  if (!session?.user) {
    return (
      <motion.div
        className="relative shrink-0"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        <Link
          href="/auth/login"
          className={cx(
            boxVariants({ hover: true, focus: true }),
            buttonVariants({ variant: "secondary", size: "sm" }),
            "inline-flex no-underline",
          )}
        >
          {t("navigation.sign_in")}
        </Link>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Box hover focus>
            <Avatar className="size-6 duration-100">
              <AvatarImage src={session.user.image ?? undefined} />
              <AvatarFallback>{getInitials(session.user.name)}</AvatarFallback>
            </Avatar>
          </Box>
        </DropdownMenuTrigger>

        <DropdownMenuContent side="bottom" align="end">
          <DropdownMenuLabel className="max-w-48 truncate font-normal leading-relaxed">
            {session.user.name}

            {session.user.name !== session.user.email && (
              <div className="text-muted-foreground truncate">{session.user.email}</div>
            )}
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          {session.user.role === "admin" && (
            <DropdownMenuItem asChild>
              <NavLink href="/admin" prefix={<ShieldHalfIcon />}>
                {t("navigation.admin_panel")}
              </NavLink>
            </DropdownMenuItem>
          )}

          <DropdownMenuItem asChild>
            <NavLink href="/dashboard" prefix={<UserIcon />} exact>
              {t("navigation.dashboard")}
            </NavLink>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <NavLink href="/dashboard/bookmarks" prefix={<BookmarkIcon />} exact>
              {t("navigation.bookmarks")}
            </NavLink>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <NavLink prefix={<LogOutIcon />} asChild>
              <UserLogout>{t("navigation.sign_out")}</UserLogout>
            </NavLink>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </motion.div>
  )
}
