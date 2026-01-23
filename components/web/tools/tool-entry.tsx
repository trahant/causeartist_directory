import { ArrowRightIcon } from "lucide-react"
import { getTranslations } from "next-intl/server"
import type { ComponentProps } from "react"
import { Button } from "~/components/common/button"
import { H2 } from "~/components/common/heading"
import { Link } from "~/components/common/link"
import { Skeleton } from "~/components/common/skeleton"
import { Stack } from "~/components/common/stack"
import { Markdown } from "~/components/web/markdown"
import { OverlayImage } from "~/components/web/overlay-image"
import { ToolButton } from "~/components/web/tools/tool-button"
import { Backdrop } from "~/components/web/ui/backdrop"
import { Favicon } from "~/components/web/ui/favicon"
import { Sticky } from "~/components/web/ui/sticky"
import { VerifiedBadge } from "~/components/web/verified-badge"
import { isToolPremiumTier } from "~/lib/tools"
import { cx } from "~/lib/utils"
import type { ToolOne } from "~/server/web/tools/payloads"

type ToolEntryProps = ComponentProps<"div"> & {
  tool: ToolOne
}

const ToolEntry = async ({ children, className, tool, ...props }: ToolEntryProps) => {
  const t = await getTranslations()
  const href = `/${tool.slug}`

  return (
    <div
      className={cx(
        "relative flex flex-col gap-6 scroll-mt-(--header-outer-offset) md:gap-8 [counter-increment:entries]",
        className,
      )}
      {...props}
    >
      <Sticky isOverlay>
        <Stack size="lg" className="not-prose justify-between">
          <Stack
            className="self-start before:content-['#'_counter(entries)] before:font-semibold before:text-3xl before:opacity-25 xl:before:absolute xl:before:right-full xl:before:mr-2"
            asChild
          >
            <Link href={href} className="group">
              <Favicon src={tool.faviconUrl} title={tool.name} className="size-8" />

              <H2 className="leading-tight! truncate underline decoration-transparent group-hover:decoration-foreground/30">
                {tool.name}
              </H2>

              {tool.ownerId && <VerifiedBadge size="lg" />}
            </Link>
          </Stack>

          <Backdrop />
        </Stack>
      </Sticky>

      {tool.description && (
        <p className="not-prose -mt-2 w-full text-secondary-foreground text-pretty md:text-lg md:-mt-4">
          {tool.description}
        </p>
      )}

      {tool.screenshotUrl && (
        <OverlayImage
          href={href}
          target="_self"
          doFollow={true}
          src={tool.screenshotUrl}
          alt={`Screenshot of ${tool.name} website`}
          className="not-prose"
        />
      )}

      {children ? (
        <div>{children}</div>
      ) : (
        tool.content && (
          <Markdown
            code={tool.content}
            className="relative max-h-72 overflow-hidden mask-b-from-80%"
          />
        )
      )}

      <Stack className="w-full not-prose">
        {isToolPremiumTier(tool) && <ToolButton tool={tool} />}

        <Button
          variant={isToolPremiumTier(tool) ? "secondary" : "primary"}
          suffix={<ArrowRightIcon />}
          className="self-start"
          asChild
        >
          <Link href={href}>{t("common.read_more")}</Link>
        </Button>
      </Stack>
    </div>
  )
}

const ToolEntrySkeleton = async () => {
  const t = await getTranslations()

  return (
    <div className="relative flex flex-col gap-6 scroll-mt-(--header-outer-offset) md:gap-8">
      <Sticky isOverlay>
        <Stack size="lg" className="not-prose justify-between">
          <Stack className="self-start w-full">
            <Favicon src="/favicon.png" className="size-8 animate-pulse opacity-50" />

            <H2 className="w-24">
              <Skeleton>&nbsp;</Skeleton>
            </H2>
          </Stack>

          <Backdrop />
        </Stack>
      </Sticky>

      <Stack size="xs" direction="column" className="-mt-2 w-full md:text-lg">
        <Skeleton className="w-full">&nbsp;</Skeleton>
        <Skeleton className="w-3/4">&nbsp;</Skeleton>
      </Stack>

      <Skeleton className="w-full aspect-video" />

      <Stack direction="column">
        <Skeleton className="w-full h-48" />
        <Skeleton className="w-full h-24" />
        <Skeleton className="w-2/3 h-12" />
      </Stack>

      <Button className="pointer-events-none opacity-10 text-transparent self-start">
        {t("common.read_more")}
      </Button>
    </div>
  )
}

export { ToolEntry, ToolEntrySkeleton }
