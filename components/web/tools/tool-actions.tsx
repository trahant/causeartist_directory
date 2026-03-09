"use client"

import { useWindowScroll } from "@mantine/hooks"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  BadgeCheckIcon,
  BookmarkIcon,
  CodeXmlIcon,
  EllipsisIcon,
  FlagIcon,
  LoaderIcon,
  SparklesIcon,
} from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { parseAsStringEnum, useQueryState } from "nuqs"
import { type ComponentProps, type SetStateAction, useEffect, useState } from "react"
import { toast } from "sonner"
import { Button } from "~/components/common/button"
import { ButtonGroup } from "~/components/common/button-group"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/common/dropdown-menu"
import { Link } from "~/components/common/link"
import { Stack } from "~/components/common/stack"
import { Tooltip } from "~/components/common/tooltip"
import { LoginDialog } from "~/components/web/auth/login-dialog"
import { ToolClaimDialog } from "~/components/web/dialogs/tool-claim-dialog"
import { ToolEmbedDialog } from "~/components/web/dialogs/tool-embed-dialog"
import { ToolReportDialog } from "~/components/web/dialogs/tool-report-dialog"
import { ToolButton } from "~/components/web/tools/tool-button"
import { reportsConfig } from "~/config/reports"
import { useSession } from "~/lib/auth-client"
import { orpc } from "~/lib/orpc-query"
import { isToolApproved, isToolPremiumTier, isToolPublished } from "~/lib/tools"
import { cx } from "~/lib/utils"
import type { ToolOne } from "~/server/web/tools/payloads"

type ToolActionsProps = ComponentProps<typeof Stack> & {
  tool: ToolOne
}

enum Dialog {
  report = "report",
  embed = "embed",
  claim = "claim",
}

export const ToolActions = ({ tool, children, className, ...props }: ToolActionsProps) => {
  const t = useTranslations("tools.actions")
  const { data: session } = useSession()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [scroll] = useWindowScroll()
  const [dialog, setDialog] = useQueryState("dialog", parseAsStringEnum(Object.values(Dialog)))
  const [isStickyButtonVisible, setIsStickyButtonVisible] = useState(false)
  const [showLoginDialog, setShowLoginDialog] = useState(false)

  // Bookmark query
  const { data: bookmarkData } = useQuery(
    orpc.web.bookmarks.check.queryOptions({
      input: { toolId: tool.id },
      enabled: !!session?.user,
    }),
  )

  const isBookmarked = bookmarkData?.bookmarked ?? false

  // Bookmark mutation
  const { mutate: toggleBookmark, isPending: isBookmarkPending } = useMutation(
    orpc.web.bookmarks.set.mutationOptions({
      onSuccess: data => {
        queryClient.invalidateQueries({ queryKey: orpc.web.bookmarks.key() })

        toast.success(data.bookmarked ? t("bookmark_added") : t("bookmark_removed"), {
          action: {
            label: t("bookmark_view"),
            onClick: () => router.push("/dashboard/bookmarks"),
          },
        })
      },
      onError: error => {
        toast.error(error.message)
      },
    }),
  )

  useEffect(() => {
    if (isToolPublished(tool)) {
      setIsStickyButtonVisible(scroll.y > 250)
    }
  }, [scroll, tool])

  const handleBookmarkClick = () => {
    if (!session?.user) {
      setShowLoginDialog(true)
      return
    }

    toggleBookmark({ toolId: tool.id, bookmarked: !isBookmarked })
  }

  const handleClose = (isOpen: SetStateAction<boolean>) => {
    if (!isOpen) {
      setDialog(null)
    }
  }

  return (
    <Stack size="sm" wrap={false} className={cx("justify-end", className)} {...props}>
      <AnimatePresence>
        {isStickyButtonVisible && (
          <motion.div
            variants={{
              hidden: { opacity: 0, x: -4, scale: 0.9 },
              visible: { opacity: 1, x: 0, scale: 1 },
            }}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ type: "spring", duration: 0.3, ease: "easeInOut" }}
            className="order-first origin-right max-md:hidden"
          >
            <ToolButton tool={tool} size="md">
              <span className="@max-sm:sr-only">{t("visit_button")}</span>
            </ToolButton>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile dropdown */}
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button size="md" variant="secondary" prefix={<EllipsisIcon />} className="@2xl:hidden">
            <span className="@max-lg:sr-only">{t("actions_button")}</span>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onSelect={e => {
              if (session?.user) {
                e.preventDefault()
              }
              handleBookmarkClick()
            }}
            disabled={isBookmarkPending}
          >
            {isBookmarkPending ? (
              <LoaderIcon className="animate-spin" />
            ) : (
              <BookmarkIcon className={cx(isBookmarked && "fill-current")} />
            )}
            {isBookmarked ? t("bookmark_saved") : t("bookmark_save")}
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {!isToolPremiumTier(tool) && tool.ownerId && tool.ownerId === session?.user.id && (
            <DropdownMenuItem asChild>
              <Link href={`/submit/${tool.slug}`}>
                <SparklesIcon />
                {t("upgrade_button")}
              </Link>
            </DropdownMenuItem>
          )}

          {!tool.ownerId && (
            <DropdownMenuItem onSelect={() => setDialog(Dialog.claim)}>
              <BadgeCheckIcon />
              {t("claim_button")}
            </DropdownMenuItem>
          )}

          {reportsConfig.enabled && (
            <DropdownMenuItem onSelect={() => setDialog(Dialog.report)}>
              <FlagIcon />
              {t("report_button")}
            </DropdownMenuItem>
          )}

          {isToolApproved(tool) && (
            <DropdownMenuItem onSelect={() => setDialog(Dialog.embed)}>
              <CodeXmlIcon />
              {t("embed_button")}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Desktop buttons */}
      {!isToolPremiumTier(tool) && tool.ownerId && tool.ownerId === session?.user.id && (
        <Tooltip tooltip={t("upgrade_tooltip")}>
          <Button
            size="md"
            variant="secondary"
            prefix={<SparklesIcon />}
            className="@max-2xl:hidden text-primary"
            asChild
          >
            <Link href={`/submit/${tool.slug}`}>{t("upgrade_button")}</Link>
          </Button>
        </Tooltip>
      )}

      {!tool.ownerId && (
        <Tooltip tooltip={t("claim_tooltip")}>
          <Button
            size="md"
            variant="secondary"
            prefix={<BadgeCheckIcon />}
            onClick={() => setDialog(Dialog.claim)}
            className="@max-2xl:hidden text-primary"
          >
            {t("claim_button")}
          </Button>
        </Tooltip>
      )}

      <ButtonGroup className="@max-2xl:hidden">
        <Tooltip tooltip={isBookmarked ? t("bookmark_remove") : t("bookmark_add")}>
          <Button
            size="md"
            variant="secondary"
            prefix={<BookmarkIcon />}
            className={cx(isBookmarked && "text-primary")}
            onClick={handleBookmarkClick}
            isPending={isBookmarkPending}
          >
            {isBookmarked ? t("bookmark_saved") : t("bookmark_save")}
          </Button>
        </Tooltip>

        {reportsConfig.enabled && (
          <Tooltip tooltip={t("report_tooltip")}>
            <Button
              size="md"
              variant="secondary"
              prefix={<FlagIcon />}
              onClick={() => setDialog(Dialog.report)}
              aria-label={t("report_button")}
            />
          </Tooltip>
        )}

        {isToolApproved(tool) && (
          <Tooltip tooltip={t("embed_tooltip")}>
            <Button
              size="md"
              variant="secondary"
              prefix={<CodeXmlIcon />}
              onClick={() => setDialog(Dialog.embed)}
              aria-label={t("embed_button")}
            />
          </Tooltip>
        )}
      </ButtonGroup>

      {children}

      {reportsConfig.enabled && (
        <ToolReportDialog tool={tool} isOpen={dialog === Dialog.report} setIsOpen={handleClose} />
      )}

      {isToolApproved(tool) && (
        <ToolEmbedDialog tool={tool} isOpen={dialog === Dialog.embed} setIsOpen={handleClose} />
      )}

      {!tool.ownerId && (
        <ToolClaimDialog tool={tool} isOpen={dialog === Dialog.claim} setIsOpen={handleClose} />
      )}

      <LoginDialog isOpen={showLoginDialog} setIsOpen={setShowLoginDialog} />
    </Stack>
  )
}
