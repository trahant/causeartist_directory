"use client"

import { XIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useMemo } from "react"
import { Button } from "~/components/common/button"
import { Link } from "~/components/common/link"
import { Note } from "~/components/common/note"
import { Stack } from "~/components/common/stack"
import { cx } from "~/lib/utils"

/**
 * Shows Better Auth (and similar) `?error=` query feedback, e.g. after magic-link verify redirects to `/`.
 */
export function AuthErrorBanner({ className }: { className?: string }) {
  const t = useTranslations("pages.auth.login.errors")
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()

  const error = searchParams.get("error")
  const next = searchParams.get("next")

  const message = useMemo(() => {
    if (!error) return null
    if (error === "ATTEMPTS_EXCEEDED") return t("ATTEMPTS_EXCEEDED")
    return t("generic")
  }, [error, t])

  const clearQuery = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("error")
    const q = params.toString()
    router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false })
  }, [pathname, router, searchParams])

  const loginHref = useMemo(() => {
    const params = new URLSearchParams()
    if (next) params.set("next", next)
    const q = params.toString()
    return q ? `/auth/login?${q}` : "/auth/login"
  }, [next])

  if (!error || !message) {
    return null
  }

  return (
    <Note
      as="div"
      className={cx(
        "mb-4 rounded-lg border px-3 py-3 border-destructive/40 bg-destructive/5 text-destructive-foreground",
        className,
      )}
      role="alert"
    >
      <Stack direction="row" wrap={false} className="items-start justify-between gap-3 w-full">
        <div className="min-w-0 flex-1 space-y-1">
          <p className="font-semibold text-sm">{t("title")}</p>
          <p className="text-sm opacity-90">{message}</p>
          <Link href={loginHref} className="text-sm font-medium underline underline-offset-2">
            {t("cta_login")}
          </Link>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="shrink-0 p-1"
          onClick={clearQuery}
          aria-label={t("dismiss")}
        >
          <XIcon className="size-4" />
        </Button>
      </Stack>
    </Note>
  )
}
