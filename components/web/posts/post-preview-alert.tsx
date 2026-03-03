import { getTranslations } from "next-intl/server"
import { PostStatus } from "~/.generated/prisma/browser"
import { Note } from "~/components/common/note"

type PostPreviewAlertProps = {
  status: PostStatus
}

export const PostPreviewAlert = async ({ status }: PostPreviewAlertProps) => {
  const t = await getTranslations("posts")
  if (status === PostStatus.Published) {
    return null
  }

  const message =
    status === PostStatus.Draft ? t("preview_alert.draft") : t("preview_alert.scheduled")

  return <Note className="rounded-lg border border-dashed p-4 text-sm">{message}</Note>
}
