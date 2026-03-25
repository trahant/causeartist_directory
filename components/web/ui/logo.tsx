import Image from "next/image"
import type { ComponentProps } from "react"
import { Link } from "~/components/common/link"
import { Stack } from "~/components/common/stack"
import { siteConfig } from "~/config/site"
import { cx } from "~/lib/utils"

export const Logo = ({ className, ...props }: ComponentProps<typeof Stack>) => {
  return (
    <Stack size="sm" className={cx("group/logo", className)} wrap={false} asChild {...props}>
      <Link href="/">
        <Image
          src="/favicon.png"
          alt=""
          width={32}
          height={32}
          className="h-5 w-5 shrink-0 object-contain"
          priority
        />
        <span className="font-medium text-sm truncate">{siteConfig.name}</span>
      </Link>
    </Stack>
  )
}
