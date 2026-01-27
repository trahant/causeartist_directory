"use client"

import { useMediaQuery } from "@mantine/hooks"
import { cx } from "cva"
import {
  CalendarIcon,
  DockIcon,
  ExternalLinkIcon,
  GalleryHorizontalEndIcon,
  GemIcon,
  LogOutIcon,
  MegaphoneIcon,
  TagIcon,
  TriangleAlertIcon,
  UsersIcon,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Nav } from "~/components/admin/nav"
import { Button } from "~/components/common/button"
import { Kbd } from "~/components/common/kbd"
import { Tooltip } from "~/components/common/tooltip"
import { LogoSymbol } from "~/components/web/ui/logo-symbol"
import { siteConfig } from "~/config/site"
import { useSearch } from "~/contexts/search-context"
import { signOut } from "~/lib/auth-client"

export const Sidebar = () => {
  const isMobile = useMediaQuery("(max-width: 768px)")
  const router = useRouter()
  const search = useSearch()

  const handleOpenSite = (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault()
    window.open(siteConfig.url, "_self")
  }

  const handleSignOut = async () => {
    signOut({
      fetchOptions: {
        onSuccess: () => {
          toast.success("You've been signed out successfully")
          router.push("/")
        },
      },
    })
  }

  return (
    <Nav
      isCollapsed={!!isMobile}
      className={cx("sticky top-0 h-dvh z-40 border-r", isMobile ? "w-12" : "w-48")}
      links={[
        {
          title: "Dashboard",
          href: "/admin",
          prefix: <LogoSymbol />,
          suffix: (
            <Tooltip tooltip="Visit site">
              <Button
                variant="ghost"
                onClick={handleOpenSite}
                className="-my-0.5 -mx-[0.21425em] px-1 py-[0.2em] text-xs/tight rounded-sm hover:bg-background"
              >
                <ExternalLinkIcon className="size-3" />
              </Button>
            </Tooltip>
          ),
        },

        undefined, // Separator

        {
          title: "Tools",
          href: "/admin/tools",
          prefix: <GemIcon />,
        },
        {
          title: "Categories",
          href: "/admin/categories",
          prefix: <GalleryHorizontalEndIcon />,
        },
        {
          title: "Tags",
          href: "/admin/tags",
          prefix: <TagIcon />,
        },
        {
          title: "Users",
          href: "/admin/users",
          prefix: <UsersIcon />,
        },
        {
          title: "Reports",
          href: "/admin/reports",
          prefix: <TriangleAlertIcon />,
        },
        {
          title: "Ads",
          href: "/admin/ads",
          prefix: <MegaphoneIcon />,
        },

        undefined, // Separator

        {
          title: "Schedule",
          href: "/admin/schedule",
          prefix: <CalendarIcon />,
        },

        undefined, // Separator

        {
          title: "Quick Menu",
          href: "#",
          onClick: search.open,
          prefix: <DockIcon />,
          suffix: <Kbd keys={["meta", "K"]} />,
        },
        {
          title: "Logout",
          href: "#",
          onClick: handleSignOut,
          prefix: <LogOutIcon />,
        },
      ]}
    />
  )
}
