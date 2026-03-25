"use client"

import { useTranslations } from "next-intl"
import {
  AskAiChatGPTIcon,
  AskAiClaudeIcon,
  AskAiGeminiIcon,
  AskAiGrokIcon,
  AskAiPerplexityIcon,
} from "~/components/common/icons/ask-ai-brand-icons"
import { H6 } from "~/components/common/heading"
import { Stack } from "~/components/common/stack"
import { ExternalLink } from "~/components/web/external-link"
import { navLinkVariants } from "~/components/web/ui/nav-link"
import { linksConfig } from "~/config/links"
import { cx } from "~/lib/utils"

const items = [
  { href: linksConfig.askAi.chatgpt, Icon: AskAiChatGPTIcon, labelKey: "ask_ai_chatgpt" as const },
  { href: linksConfig.askAi.perplexity, Icon: AskAiPerplexityIcon, labelKey: "ask_ai_perplexity" as const },
  { href: linksConfig.askAi.gemini, Icon: AskAiGeminiIcon, labelKey: "ask_ai_gemini" as const },
  { href: linksConfig.askAi.grok, Icon: AskAiGrokIcon, labelKey: "ask_ai_grok" as const },
  { href: linksConfig.askAi.claude, Icon: AskAiClaudeIcon, labelKey: "ask_ai_claude" as const },
]

export const FooterAskAI = ({ className }: { className?: string }) => {
  const t = useTranslations("components.footer")

  return (
    <section
      className={cx(
        "flex flex-col items-center gap-4 border-t border-foreground/10 pt-8 text-center",
        className,
      )}
    >
      <H6 as="strong" className="text-base">
        {t("ask_ai_title")}
      </H6>

      <nav aria-label={t("ask_ai_nav_label")}>
        <Stack
          wrap={false}
          className="justify-center gap-6 text-foreground sm:gap-8 md:gap-10"
        >
          {items.map(({ href, Icon, labelKey }) => (
            <ExternalLink
              key={labelKey}
              href={href}
              className={cx(navLinkVariants(), "inline-flex opacity-90 hover:opacity-100")}
              aria-label={t(labelKey)}
            >
              <Icon className="size-8 shrink-0 sm:size-9" aria-hidden />
            </ExternalLink>
          ))}
        </Stack>
      </nav>
    </section>
  )
}
