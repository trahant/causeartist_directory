import { formatProfileContent } from "~/lib/format-profile-content"
import { cx } from "~/lib/utils"

export function ProfileContent({
  content,
  className,
}: {
  content: string | null | undefined
  className?: string
}) {
  if (content == null || content.trim() === "") return null

  const formatted = formatProfileContent(content)
  if (!formatted) return null

  return (
    <div
      className={cx(
        "prose prose-neutral max-w-none dark:prose-invert",
        "prose-p:mb-3 prose-p:text-sm prose-p:leading-relaxed prose-p:text-secondary-foreground",
        className,
      )}
      // eslint-disable-next-line react/no-danger -- escaped in formatProfileContent
      dangerouslySetInnerHTML={{ __html: formatted }}
    />
  )
}
