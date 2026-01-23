"use client"

import { useWindowScroll } from "@mantine/hooks"
import { BadgeCheckIcon, CodeXmlIcon, FlagIcon, SparklesIcon } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { useTranslations } from "next-intl"
import { parseAsStringEnum, useQueryState } from "nuqs"
import { type ComponentProps, type SetStateAction, useEffect, useState } from "react"
import { Button } from "~/components/common/button"
import { Link } from "~/components/common/link"
import { Stack } from "~/components/common/stack"
import { Tooltip } from "~/components/common/tooltip"
import { ToolClaimDialog } from "~/components/web/dialogs/tool-claim-dialog"
import { ToolEmbedDialog } from "~/components/web/dialogs/tool-embed-dialog"
import { ToolReportDialog } from "~/components/web/dialogs/tool-report-dialog"
import { ToolButton } from "~/components/web/tools/tool-button"
import { reportsConfig } from "~/config/reports"
import { useSession } from "~/lib/auth-client"
import { isToolPremiumTier, isToolApproved, isToolPublished } from "~/lib/tools"
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
  const [scroll] = useWindowScroll()
  const [dialog, setDialog] = useQueryState("dialog", parseAsStringEnum(Object.values(Dialog)))
  const [isStickyButtonVisible, setIsStickyButtonVisible] = useState(false)

  useEffect(() => {
    if (isToolPublished(tool)) {
      setIsStickyButtonVisible(scroll.y > 250)
    }
  }, [scroll])

  const handleClose = (isOpen: SetStateAction<boolean>) => {
    !isOpen && setDialog(null)
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
              <span className="@max-xl:sr-only">{t("visit_button")}</span>
            </ToolButton>
          </motion.div>
        )}
      </AnimatePresence>

      {!isToolPremiumTier(tool) && tool.ownerId && tool.ownerId === session?.user.id && (
        <Tooltip tooltip={t("promote_tooltip")}>
          <Button
            size="md"
            variant="secondary"
            prefix={<SparklesIcon className="text-inherit" />}
            className="text-blue-600 dark:text-blue-400"
            asChild
          >
            <Link href={`/submit/${tool.slug}`}>{t("promote_button")}</Link>
          </Button>
        </Tooltip>
      )}

      {!tool.ownerId && (
        <Tooltip tooltip={t("claim_tooltip")}>
          <Button
            size="md"
            variant="secondary"
            prefix={<BadgeCheckIcon className="text-inherit" />}
            onClick={() => setDialog(Dialog.claim)}
            className="text-blue-600 dark:text-blue-400"
          >
            {t("claim_button")}
          </Button>
        </Tooltip>
      )}

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
    </Stack>
  )
}
