"use client"

import { useMediaQuery } from "@mantine/hooks"
import { cx } from "cva"
import {
  AwardIcon,
  BookOpenTextIcon,
  Building2Icon,
  CrosshairIcon,
  DockIcon,
  ExternalLinkIcon,
  FileTextIcon,
  HandCoinsIcon,
  LayersIcon,
  LineChartIcon,
  LogOutIcon,
  MapPinIcon,
  PenLineIcon,
  MegaphoneIcon,
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
          title: "Blog",
          href: "/admin/blog-posts",
          prefix: <FileTextIcon />,
        },
        {
          title: "Case Studies",
          href: "/admin/case-studies",
          prefix: <BookOpenTextIcon />,
        },
        {
          title: "Authors",
          href: "/admin/authors",
          prefix: <PenLineIcon />,
        },
        {
          title: "Companies",
          href: "/admin/companies",
          prefix: <Building2Icon />,
        },
        {
          title: "Funders",
          href: "/admin/funders",
          prefix: <HandCoinsIcon />,
        },

        undefined, // Separator

        { type: "section", title: "Directory taxonomy" },
        {
          title: "Sectors",
          href: "/admin/sectors",
          prefix: <LayersIcon />,
        },
        {
          title: "Certifications",
          href: "/admin/certifications",
          prefix: <AwardIcon />,
        },
        {
          title: "Focus areas",
          href: "/admin/focus-areas",
          prefix: <CrosshairIcon />,
        },
        {
          title: "Locations",
          href: "/admin/locations",
          prefix: <MapPinIcon />,
        },
        {
          title: "Funding stages",
          href: "/admin/funding-stages",
          prefix: <LineChartIcon />,
        },

        undefined, // Separator

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
