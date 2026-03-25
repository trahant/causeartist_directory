import { formatNumber } from "@primoui/utils"
import { useTranslations } from "next-intl"
import Image from "next/image"
import type { ComponentProps } from "react"
import { Note } from "~/components/common/note"
import { Stack } from "~/components/common/stack"
import { cx } from "~/lib/utils"

export const CTAProof = ({ className, ...props }: ComponentProps<typeof Stack>) => {
  const t = useTranslations("components.cta_proof")

  return (
    <Stack size="sm" direction="column" className={cx("items-center", className)} {...props}>
      <div className="flex flex-wrap items-center justify-center -space-x-1.5">
        {Array.from({ length: 5 }).map((_, index) => (
          <Image
            key={index}
            src={`/users/${index + 1}.webp`}
            alt=""
            width={56}
            height={56}
            loading="lazy"
            className="size-7 border-2 border-card rounded-full"
          />
        ))}
      </div>

      <Note className="text-xs">{t("message", { count: formatNumber(20000, "standard") })}</Note>
    </Stack>
  )
}
