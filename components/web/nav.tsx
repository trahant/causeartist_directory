"use client"

import { useClipboard, useHotkeys } from "@mantine/hooks"
import { useTranslations } from "next-intl"
import { usePathname } from "next/navigation"
import { Slot } from "radix-ui"
import type { ComponentProps, ReactNode } from "react"
import { toast } from "sonner"
import { BrandBlueskyIcon } from "~/components/common/icons/brand-bluesky"
import { BrandFacebookIcon } from "~/components/common/icons/brand-facebook"
import { BrandHackerNewsIcon } from "~/components/common/icons/brand-hackernews"
import { BrandLinkedInIcon } from "~/components/common/icons/brand-linkedin"
import { BrandMastodonIcon } from "~/components/common/icons/brand-mastodon"
import { BrandRedditIcon } from "~/components/common/icons/brand-reddit"
import { BrandWhatsAppIcon } from "~/components/common/icons/brand-whatsapp"
import { BrandXIcon } from "~/components/common/icons/brand-x"
import { Kbd } from "~/components/common/kbd"
import { Note } from "~/components/common/note"
import { Tooltip, TooltipProvider } from "~/components/common/tooltip"
import { ExternalLink } from "~/components/web/external-link"
import { siteConfig } from "~/config/site"
import { cva, cx } from "~/lib/utils"

type Platform =
  | "X"
  | "Bluesky"
  | "Mastodon"
  | "Facebook"
  | "LinkedIn"
  | "HackerNews"
  | "Reddit"
  | "WhatsApp"

type ShareOption = {
  platform: Platform
  url: (shareUrl: string, shareTitle: string) => string
  icon: ReactNode
}

const shareOptions: ShareOption[] = [
  {
    platform: "X",
    url: (url, title) => `https://x.com/intent/post?text=${title}&url=${url}`,
    icon: <BrandXIcon />,
  },
  {
    platform: "Bluesky",
    url: (url, title) => `https://bsky.app/intent/compose?text=${title}+${url}`,
    icon: <BrandBlueskyIcon />,
  },
  {
    platform: "Mastodon",
    url: (url, title) => `https://mastodon.social/share?text=${title}+${url}`,
    icon: <BrandMastodonIcon />,
  },
  {
    platform: "Facebook",
    url: url => `https://www.facebook.com/sharer/sharer.php?u=${url}`,
    icon: <BrandFacebookIcon />,
  },
  {
    platform: "LinkedIn",
    url: (url, title) => `https://linkedin.com/sharing/share-offsite?url=${url}&text=${title}`,
    icon: <BrandLinkedInIcon />,
  },
  {
    platform: "HackerNews",
    url: (url, title) => `https://news.ycombinator.com/submitlink?u=${url}&t=${title}`,
    icon: <BrandHackerNewsIcon />,
  },
  {
    platform: "Reddit",
    url: (url, title) => `https://reddit.com/submit?url=${url}&title=${title}`,
    icon: <BrandRedditIcon />,
  },
  {
    platform: "WhatsApp",
    url: (url, title) => `https://api.whatsapp.com/send?text=${title}+${url}`,
    icon: <BrandWhatsAppIcon />,
  },
]

const navItemVariants = cva({
  base: "py-1 px-[5px] text-xs font-medium text-secondary-foreground rounded-sm hover:text-foreground",
})

type NavProps = ComponentProps<"div"> & {
  title: string
}

export const Nav = ({ className, title, ...props }: NavProps) => {
  const t = useTranslations("tools.nav")
  const pathname = usePathname()
  const clipboard = useClipboard({ timeout: 2000 })

  const currentUrl = encodeURIComponent(`${siteConfig.url}${pathname}`)
  const shareTitle = encodeURIComponent(`${title} — ${siteConfig.name}`)

  const handleCopyLink = () => {
    clipboard.copy(window.location.href)
    toast.success(t("link_copied"))
  }

  useHotkeys([["C", handleCopyLink, { preventDefault: true }]])

  return (
    <TooltipProvider delayDuration={0} disableHoverableContent>
      <div
        className={cx("flex flex-wrap items-center p-1 bg-background border rounded-lg", className)}
        {...props}
      >
        <button type="button" className={navItemVariants()} onClick={handleCopyLink}>
          {t("copy_link")}{" "}
          <Kbd className="ml-0.5 max-md:hidden" keys={[clipboard.copied ? "✔︎" : "C"]} />
        </button>

        <div className="w-px h-4 mx-1.5 bg-ring" />

        <Note className="mx-1 text-xs font-medium max-lg:hidden">{t("share")}:</Note>

        {shareOptions.map(({ platform, url, icon }) => (
          <Tooltip key={platform} tooltip={t("share_on", { platform })} sideOffset={0}>
            <ExternalLink
              href={url(currentUrl, shareTitle)}
              className={navItemVariants()}
              aria-label={t("share_on", { platform })}
              eventName="click_share"
              eventProps={{ url: currentUrl, platform }}
            >
              <Slot.Root className="size-4">{icon}</Slot.Root>
            </ExternalLink>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  )
}
